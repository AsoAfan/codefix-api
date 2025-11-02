import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../user/users.entity';
import { Comment } from '../comment/comment.entity';

export enum VoteType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote',
}

@Entity('votes')
@Index(['user', 'comment'])
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: VoteType })
  type: VoteType;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.votes, { nullable: false })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Comment, (comment) => comment.votes, { nullable: false, onDelete: 'CASCADE' })
  comment: Comment;

  @Column()
  commentId: number;
}
