import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Post } from '../post/post.entity';

@Entity('tags')
@Index(['name'])
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // @Column({ default: 0 })
  // usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
