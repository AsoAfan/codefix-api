import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/createPost.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { QueryPostsDto } from './dtos/query-posts.dto';
import { User } from '../user/users.entity';

describe('PostController', () => {
  let controller: PostController;
  let service: PostService;

  const mockPostService = {
    createPost: jest.fn(),
    getAllPosts: jest.fn(),
    getPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: mockPostService,
        },
      ],
    }).compile();

    controller = module.get<PostController>(PostController);
    service = module.get<PostService>(PostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPost', () => {
    it('should call service.createPost with correct parameters', async () => {
      const createDto: CreatePostDto = {
        title: 'Test Post',
        body: 'Test body content with enough characters',
      };
      const user: User = { id: 1 } as User;
      const post = { id: 1, ...createDto };

      mockPostService.createPost.mockResolvedValue(post);

      const result = await controller.createPost(createDto, user);

      expect(mockPostService.createPost).toHaveBeenCalledWith(createDto, 1);
      expect(result).toBeDefined();
    });
  });

  describe('getAllPosts', () => {
    it('should call service.getAllPosts with query parameters', async () => {
      const queryDto: QueryPostsDto = { page: 1, limit: 10 };
      const result = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };

      mockPostService.getAllPosts.mockResolvedValue(result);

      await controller.getAllPosts(queryDto);

      expect(mockPostService.getAllPosts).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('getPost', () => {
    it('should call service.getPost with id', async () => {
      const post = { id: 1, title: 'Test Post' };
      mockPostService.getPost.mockResolvedValue(post);

      await controller.getPost(1);

      expect(mockPostService.getPost).toHaveBeenCalledWith(1);
    });
  });

  describe('updatePost', () => {
    it('should call service.updatePost with correct parameters', async () => {
      const updateDto: UpdatePostDto = { title: 'Updated Title' };
      const user: User = { id: 1 } as User;
      const post = { id: 1, ...updateDto };

      mockPostService.updatePost.mockResolvedValue(post);

      await controller.updatePost(1, updateDto, user);

      expect(mockPostService.updatePost).toHaveBeenCalledWith(
        1,
        updateDto,
        1,
      );
    });
  });

  describe('deletePost', () => {
    it('should call service.deletePost with correct parameters', async () => {
      const user: User = { id: 1 } as User;
      mockPostService.deletePost.mockResolvedValue(undefined);

      await controller.deletePost(1, user);

      expect(mockPostService.deletePost).toHaveBeenCalledWith(1, 1);
    });
  });
});
