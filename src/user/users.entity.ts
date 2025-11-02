import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Post } from '../post/post.entity';
import { Comment } from '../comment/comment.entity';
import { Vote } from '../vote/vote.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  username: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: 'admin' | 'user';

  // @Column({ default: 0 })
  // reputation: number;

  // @Column({ nullable: true })
  // displayName: string;

  // @Column({ type: 'text', nullable: true })
  // about: string;

  // @Column({ nullable: true })
  // location: string;

  // @Column({ nullable: true })
  // website: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  // @Column({ default: 0 })
  // views: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];
}
