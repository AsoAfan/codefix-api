import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment } from './comment.entity';
import { Post } from '../post/post.entity';
import { User } from '../user/users.entity';
import { Vote, VoteType } from '../vote/vote.entity';
import { CreateCommentDto } from './dtos/createComment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { VoteCommentDto } from './dtos/vote-comment.dto';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: Repository<Comment>;
  let postRepository: Repository<Post>;
  let userRepository: Repository<User>;
  let voteRepository: Repository<Vote>;
  let dataSource: DataSource;

  const mockCommentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockPostRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockVoteRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockEntityManager = {
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Vote),
          useValue: mockVoteRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    voteRepository = module.get<Repository<Vote>>(getRepositoryToken(Vote));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    const createCommentDto: CreateCommentDto = {
      postId: 1,
      content: 'Test comment',
    };

    it('should create a comment successfully', async () => {
      const post = { id: 1, title: 'Test Post' };
      const author = { id: 1, username: 'testuser' };
      const comment = {
        id: 1,
        ...createCommentDto,
        authorId: 1,
        post,
        author,
        score: 0,
      };

      mockPostRepository.findOne.mockResolvedValue(post);
      mockUserRepository.findOne.mockResolvedValue(author);
      mockCommentRepository.create.mockReturnValue(comment);
      mockCommentRepository.save.mockResolvedValue(comment);

      const result = await service.createComment(createCommentDto, 1);

      expect(result).toEqual(comment);
      expect(mockPostRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createComment(createCommentDto, 1),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createComment(createCommentDto, 1),
      ).rejects.toThrow('Post not found');
    });

    it('should throw NotFoundException if user not found', async () => {
      const post = { id: 1 };
      mockPostRepository.findOne.mockResolvedValue(post);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createComment(createCommentDto, 999),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createComment(createCommentDto, 999),
      ).rejects.toThrow('User not found');
    });
  });

  describe('findAllByPost', () => {
    it('should return comments for a post', async () => {
      const comments = [
        { id: 1, content: 'Comment 1', score: 5 },
        { id: 2, content: 'Comment 2', score: 3 },
      ];

      mockCommentRepository.find.mockResolvedValue(comments);

      const result = await service.findAllByPost(1);

      expect(result).toEqual(comments);
      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { postId: 1 },
        relations: ['author'],
        order: { score: 'DESC', createdAt: 'ASC' },
      });
    });
  });

  describe('updateComment', () => {
    const updateDto: UpdateCommentDto = {
      content: 'Updated comment',
    };

    it('should update comment successfully', async () => {
      const comment = {
        id: 1,
        content: 'Original comment',
        authorId: 1,
      };

      mockCommentRepository.findOne.mockResolvedValue(comment);
      mockCommentRepository.save.mockResolvedValue({
        ...comment,
        ...updateDto,
      });

      const result = await service.updateComment(1, updateDto, 1);

      expect(result.content).toBe('Updated comment');
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(service.updateComment(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const comment = {
        id: 1,
        content: 'Comment',
        authorId: 1,
      };

      mockCommentRepository.findOne.mockResolvedValue(comment);

      await expect(service.updateComment(1, updateDto, 2)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.updateComment(1, updateDto, 2)).rejects.toThrow(
        'You can only update your own comments',
      );
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      const comment = {
        id: 1,
        content: 'Comment to delete',
        authorId: 1,
      };

      mockCommentRepository.findOne.mockResolvedValue(comment);
      mockCommentRepository.remove.mockResolvedValue(comment);

      await service.deleteComment(1, 1);

      expect(mockCommentRepository.remove).toHaveBeenCalledWith(comment);
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteComment(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const comment = {
        id: 1,
        content: 'Comment',
        authorId: 1,
      };

      mockCommentRepository.findOne.mockResolvedValue(comment);

      await expect(service.deleteComment(1, 2)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('voteComment', () => {
    const voteDto: VoteCommentDto = {
      type: VoteType.UPVOTE,
    };

    beforeEach(() => {
      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Comment) return mockCommentRepository;
        if (entity === Vote) return mockVoteRepository;
        return null;
      });

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });
    });

    it('should create a new upvote', async () => {
      const comment = { id: 1, score: 0 };
      const vote = { id: 1, type: VoteType.UPVOTE, commentId: 1, userId: 1 };

      mockCommentRepository.findOne.mockResolvedValue(comment);
      mockVoteRepository.findOne.mockResolvedValue(null);
      mockVoteRepository.create.mockReturnValue(vote);
      mockVoteRepository.save.mockResolvedValue(vote);
      mockCommentRepository.save.mockResolvedValue({ ...comment, score: 1 });
      mockCommentRepository.findOne.mockResolvedValueOnce(comment);

      const result = await service.voteComment(1, voteDto, 1);

      expect(result).toBeDefined();
      expect(mockVoteRepository.save).toHaveBeenCalled();
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should toggle vote off if same vote exists', async () => {
      const comment = { id: 1, score: 1 };
      const existingVote = {
        id: 1,
        type: VoteType.UPVOTE,
        commentId: 1,
        userId: 1,
      };

      mockCommentRepository.findOne.mockResolvedValue(comment);
      mockVoteRepository.findOne.mockResolvedValue(existingVote);
      mockCommentRepository.save.mockResolvedValue({ ...comment, score: 0 });

      await service.voteComment(1, voteDto, 1);

      expect(mockVoteRepository.remove).toHaveBeenCalled();
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should change vote type from upvote to downvote', async () => {
      const comment = { id: 1, score: 1 };
      const existingVote = {
        id: 1,
        type: VoteType.UPVOTE,
        commentId: 1,
        userId: 1,
      };
      const downvoteDto: VoteCommentDto = { type: VoteType.DOWNVOTE };

      mockCommentRepository.findOne.mockResolvedValue(comment);
      mockVoteRepository.findOne.mockResolvedValue(existingVote);
      mockVoteRepository.save.mockResolvedValue({
        ...existingVote,
        type: VoteType.DOWNVOTE,
      });
      mockCommentRepository.save.mockResolvedValue({ ...comment, score: -1 });

      await service.voteComment(1, downvoteDto, 1);

      expect(mockVoteRepository.save).toHaveBeenCalled();
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(service.voteComment(999, voteDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeVote', () => {
    beforeEach(() => {
      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Comment) return mockCommentRepository;
        if (entity === Vote) return mockVoteRepository;
        return null;
      });

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });
    });

    it('should remove vote successfully', async () => {
      const comment = { id: 1, score: 1 };
      const vote = {
        id: 1,
        type: VoteType.UPVOTE,
        commentId: 1,
        userId: 1,
      };

      mockVoteRepository.findOne.mockResolvedValue(vote);
      mockCommentRepository.findOne.mockResolvedValue(comment);
      mockCommentRepository.save.mockResolvedValue({ ...comment, score: 0 });
      mockVoteRepository.remove.mockResolvedValue(vote);

      await service.removeVote(1, 1);

      expect(mockVoteRepository.remove).toHaveBeenCalled();
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if vote not found', async () => {
      mockVoteRepository.findOne.mockResolvedValue(null);

      await expect(service.removeVote(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
