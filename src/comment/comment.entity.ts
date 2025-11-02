import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../post/post.entity';
import { User } from '../user/users.entity';
import { Vote } from '../vote/vote.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  score: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Post, (post) => post.comments, { nullable: false, onDelete: 'CASCADE' })
  post: Post;

  @Column()
  postId: number;

  @ManyToOne(() => User, (user) => user.comments, { nullable: false })
  author: User;

  @Column()
  authorId: number;

  @OneToMany(() => Vote, (vote) => vote.comment)
  votes: Vote[];
}