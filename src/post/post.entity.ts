import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../user/users.entity';
import { Comment } from '../comment/comment.entity';
import { Tag } from '../tag/tag.entity';

@Entity('posts')
@Index(['createdAt'])
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: 0 })
  views: number;

  @Column({ nullable: true, type: 'text' })
  excerpt: string;

  @CreateDateColumn()
  createdAt: Date;

  // @UpdateDateColumn()
  // lastActivityAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.posts, { nullable: false })
  author: User;

  @Column()
  authorId: number;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[]; // Comments serve as responses/answers

  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
