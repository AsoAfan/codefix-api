import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { Post } from '../post/post.entity';
import { User } from '../user/users.entity';
import { Vote } from '../vote/vote.entity';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [TypeOrmModule.forFeature([Comment, Post, User, Vote])],
})
export class CommentModule {}
