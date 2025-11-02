import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dtos/createComment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { VoteCommentDto } from './dtos/vote-comment.dto';
import { User } from '../user/users.entity';
import { VoteType } from '../vote/vote.entity';

describe('CommentController', () => {
  let controller: CommentController;
  let service: CommentService;

  const mockCommentService = {
    createComment: jest.fn(),
    findAllByPost: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    voteComment: jest.fn(),
    removeVote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: mockCommentService,
        },
      ],
    }).compile();

    controller = module.get<CommentController>(CommentController);
    service = module.get<CommentService>(CommentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createComment', () => {
    it('should call service.createComment with correct parameters', async () => {
      const createDto: CreateCommentDto = {
        postId: 1,
        content: 'Test comment',
      };
      const user: User = { id: 1 } as User;
      const comment = { id: 1, ...createDto };

      mockCommentService.createComment.mockResolvedValue(comment);

      await controller.createComment(createDto, user);

      expect(mockCommentService.createComment).toHaveBeenCalledWith(
        createDto,
        1,
      );
    });
  });

  describe('getCommentsByPost', () => {
    it('should call service.findAllByPost with postId', async () => {
      const comments = [{ id: 1, content: 'Comment 1' }];
      mockCommentService.findAllByPost.mockResolvedValue(comments);

      await controller.getCommentsByPost(1);

      expect(mockCommentService.findAllByPost).toHaveBeenCalledWith(1);
    });
  });

  describe('updateComment', () => {
    it('should call service.updateComment with correct parameters', async () => {
      const updateDto: UpdateCommentDto = { content: 'Updated comment' };
      const user: User = { id: 1 } as User;
      const comment = { id: 1, ...updateDto };

      mockCommentService.updateComment.mockResolvedValue(comment);

      await controller.updateComment(1, updateDto, user);

      expect(mockCommentService.updateComment).toHaveBeenCalledWith(
        1,
        updateDto,
        1,
      );
    });
  });

  describe('deleteComment', () => {
    it('should call service.deleteComment with correct parameters', async () => {
      const user: User = { id: 1 } as User;
      mockCommentService.deleteComment.mockResolvedValue(undefined);

      await controller.deleteComment(1, user);

      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('voteComment', () => {
    it('should call service.voteComment with correct parameters', async () => {
      const voteDto: VoteCommentDto = { type: VoteType.UPVOTE };
      const user: User = { id: 1 } as User;
      const comment = { id: 1, score: 1 };

      mockCommentService.voteComment.mockResolvedValue(comment);

      await controller.voteComment(1, voteDto, user);

      expect(mockCommentService.voteComment).toHaveBeenCalledWith(
        1,
        voteDto,
        1,
      );
    });
  });

  describe('removeVote', () => {
    it('should call service.removeVote with correct parameters', async () => {
      const user: User = { id: 1 } as User;
      const comment = { id: 1, score: 0 };

      mockCommentService.removeVote.mockResolvedValue(comment);

      await controller.removeVote(1, user);

      expect(mockCommentService.removeVote).toHaveBeenCalledWith(1, 1);
    });
  });
});
