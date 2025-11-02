import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dtos/createComment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { VoteCommentDto } from './dtos/vote-comment.dto';
import { Post } from '../post/post.entity';
import { User } from '../user/users.entity';
import { Vote, VoteType } from '../vote/vote.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    private readonly dataSource: DataSource,
  ) {}

  async createComment(
    createCommentDto: CreateCommentDto,
    authorId: number,
  ): Promise<Comment> {
    const post = await this.postRepo.findOne({
      where: { id: createCommentDto.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const author = await this.userRepo.findOne({ where: { id: authorId } });
    if (!author) {
      throw new NotFoundException('User not found');
    }

    const comment = this.commentRepo.create({
      content: createCommentDto.content,
      post,
      postId: post.id,
      author,
      authorId,
      score: 0,
    });

    return this.commentRepo.save(comment);
  }

  async findAllByPost(postId: number): Promise<Comment[]> {
    return this.commentRepo.find({
      where: { postId },
      relations: ['author'],
      order: { score: 'DESC', createdAt: 'ASC' },
    });
  }

  async updateComment(
    id: number,
    updateCommentDto: UpdateCommentDto,
    userId: number,
  ): Promise<Comment> {
    const comment = await this.commentRepo.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    if (updateCommentDto.content !== undefined) {
      comment.content = updateCommentDto.content;
    }

    return this.commentRepo.save(comment);
  }

  async deleteComment(id: number, userId: number): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepo.remove(comment);
  }

  async voteComment(
    commentId: number,
    voteDto: VoteCommentDto,
    userId: number,
  ): Promise<Comment> {
    return this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(Comment);
      const voteRepository = manager.getRepository(Vote);

      const comment = await commentRepository.findOne({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundException(`Comment with ID ${commentId} not found`);
      }

      // Check if user already voted on this comment
      const existingVote = await voteRepository.findOne({
        where: {
          commentId,
          userId,
        },
      });

      let voteChange = 0;

      if (existingVote) {
        // If same vote type, remove the vote (toggle off)
        if (existingVote.type === voteDto.type) {
          voteChange = voteDto.type === VoteType.UPVOTE ? -1 : 1;
          await voteRepository.remove(existingVote);
        } else {
          // Change vote type (toggle between upvote and downvote)
          voteChange = voteDto.type === VoteType.UPVOTE ? 2 : -2;
          existingVote.type = voteDto.type;
          await voteRepository.save(existingVote);
        }
      } else {
        // New vote
        const vote = voteRepository.create({
          type: voteDto.type,
          commentId,
          userId,
        });
        await voteRepository.save(vote);
        voteChange = voteDto.type === VoteType.UPVOTE ? 1 : -1;
      }

      // Update comment score atomically
      comment.score += voteChange;
      await commentRepository.save(comment);

      // Return updated comment with relations
      return this.findOne(commentId);
    });
  }

  async removeVote(commentId: number, userId: number): Promise<Comment> {
    return this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(Comment);
      const voteRepository = manager.getRepository(Vote);

      const vote = await voteRepository.findOne({
        where: { commentId, userId },
      });

      if (!vote) {
        throw new NotFoundException('Vote not found');
      }

      const comment = await commentRepository.findOne({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      // Update score before removing vote
      comment.score += vote.type === VoteType.UPVOTE ? -1 : 1;
      await commentRepository.save(comment);

      await voteRepository.remove(vote);

      // Return updated comment with relations
      return this.findOne(commentId);
    });
  }

  private async findOne(id: number): Promise<Comment> {
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['author', 'post'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }
}
