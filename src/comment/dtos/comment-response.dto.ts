import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '../comment.entity';

@Exclude()
export class CommentAuthorDto {
  @ApiProperty({ description: 'Author ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @Expose()
  username: string;
}

@Exclude()
export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Comment content', example: 'This is a helpful comment' })
  @Expose()
  content: string;

  @ApiProperty({ description: 'Comment score (votes)', example: 5 })
  @Expose()
  score: number;

  @ApiProperty({ description: 'Creation date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'Author information', type: CommentAuthorDto })
  @Expose()
  @Type(() => CommentAuthorDto)
  author: CommentAuthorDto;

  @ApiProperty({ description: 'Post ID', example: 1 })
  @Expose()
  postId: number;

  constructor(partial: Partial<Comment>) {
    Object.assign(this, partial);
  }
}

