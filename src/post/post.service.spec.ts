import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { Post } from './post.entity';
import { Tag } from '../tag/tag.entity';
import { User } from '../user/users.entity';
import { CreatePostDto } from './dtos/createPost.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { QueryPostsDto } from './dtos/query-posts.dto';

describe('PostService', () => {
  let service: PostService;
  let postRepository: Repository<Post>;
  let tagRepository: Repository<Tag>;
  let userRepository: Repository<User>;

  const mockPostRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    increment: jest.fn(),
    remove: jest.fn(),
  };

  const mockTagRepository = {
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    tagRepository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    const createPostDto: CreatePostDto = {
      title: 'Test Post',
      body: 'Test body content with enough characters',
    };

    it('should create a post successfully', async () => {
      const author = { id: 1, username: 'testuser' };
      const post = {
        id: 1,
        ...createPostDto,
        authorId: 1,
        author,
      };

      mockUserRepository.findOne.mockResolvedValue(author);
      mockPostRepository.create.mockReturnValue(post);
      mockPostRepository.save.mockResolvedValue(post);

      const result = await service.createPost(createPostDto, 1);

      expect(result).toEqual(post);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPostRepository.create).toHaveBeenCalled();
      expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if author not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.createPost(createPostDto, 999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createPost(createPostDto, 999)).rejects.toThrow(
        'Author not found',
      );
    });

    it('should create post with tags', async () => {
      const author = { id: 1, username: 'testuser' };
      const tags = [{ id: 1, name: 'nestjs' }, { id: 2, name: 'typescript' }];
      const post = {
        id: 1,
        ...createPostDto,
        tags: [1, 2],
        authorId: 1,
        author,
      };

      mockUserRepository.findOne.mockResolvedValue(author);
      mockTagRepository.find.mockResolvedValue(tags);
      mockPostRepository.create.mockReturnValue(post);
      mockPostRepository.save.mockResolvedValue({ ...post, tags });

      const result = await service.createPost(
        { ...createPostDto, tags: [1, 2] },
        1,
      );

      expect(mockTagRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
      expect(result.tags).toEqual(tags);
    });

    it('should throw BadRequestException if tag not found', async () => {
      const author = { id: 1, username: 'testuser' };
      mockUserRepository.findOne.mockResolvedValue(author);
      mockTagRepository.find.mockResolvedValue([{ id: 1 }]); // Only one tag found

      await expect(
        service.createPost({ ...createPostDto, tags: [1, 2] }, 1),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createPost({ ...createPostDto, tags: [1, 2] }, 1),
      ).rejects.toThrow('One or more tags not found');
    });
  });

  describe('getAllPosts', () => {
    it('should return paginated posts', async () => {
      const posts = [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([posts, 2]);

      const queryDto: QueryPostsDto = { page: 1, limit: 10 };
      const result = await service.getAllPosts(queryDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual(posts);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should apply search filter', async () => {
      const queryDto: QueryPostsDto = { search: 'test', page: 1, limit: 10 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAllPosts(queryDto);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should apply author filter', async () => {
      const queryDto: QueryPostsDto = { authorId: 1, page: 1, limit: 10 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAllPosts(queryDto);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });
  });

  describe('getPost', () => {
    it('should return a post and increment views', async () => {
      const post = {
        id: 1,
        title: 'Test Post',
        views: 5,
        author: { id: 1 },
        tags: [],
        comments: [],
      };

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.increment.mockResolvedValue(undefined);

      const result = await service.getPost(1);

      expect(result).toEqual({ ...post, views: 6 });
      expect(mockPostRepository.increment).toHaveBeenCalledWith(
        { id: 1 },
        'views',
        1,
      );
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.getPost(999)).rejects.toThrow(NotFoundException);
      await expect(service.getPost(999)).rejects.toThrow(
        'Post with ID 999 not found',
      );
    });
  });

  describe('updatePost', () => {
    const updateDto: UpdatePostDto = {
      title: 'Updated Title',
    };

    it('should update post successfully', async () => {
      const post = {
        id: 1,
        title: 'Original Title',
        body: 'Body',
        authorId: 1,
        tags: [],
      };

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.save.mockResolvedValue({ ...post, ...updateDto });

      const result = await service.updatePost(1, updateDto, 1);

      expect(result.title).toBe('Updated Title');
      expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePost(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const post = {
        id: 1,
        title: 'Original Title',
        authorId: 1,
      };

      mockPostRepository.findOne.mockResolvedValue(post);

      await expect(service.updatePost(1, updateDto, 2)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.updatePost(1, updateDto, 2)).rejects.toThrow(
        'You can only update your own posts',
      );
    });
  });

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      const post = {
        id: 1,
        title: 'Post to delete',
        authorId: 1,
      };

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.remove.mockResolvedValue(post);

      await service.deletePost(1, 1);

      expect(mockPostRepository.remove).toHaveBeenCalledWith(post);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.deletePost(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const post = {
        id: 1,
        title: 'Post',
        authorId: 1,
      };

      mockPostRepository.findOne.mockResolvedValue(post);

      await expect(service.deletePost(1, 2)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
