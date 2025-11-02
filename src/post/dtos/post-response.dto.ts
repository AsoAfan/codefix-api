import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Post } from '../post.entity';

@Exclude()
export class AuthorDto {
  @ApiProperty({ description: 'Author ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @Expose()
  username: string;
}

@Exclude()
export class TagDto {
  @ApiProperty({ description: 'Tag ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Tag name', example: 'nestjs' })
  @Expose()
  name: string;
}

@Exclude()
export class PostResponseDto {
  @ApiProperty({ description: 'Post ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Post title', example: 'How to use NestJS' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Post body', example: 'This is the content...' })
  @Expose()
  body: string;

  @ApiProperty({ description: 'Post excerpt', example: 'Short summary...', required: false })
  @Expose()
  excerpt?: string;

  @ApiProperty({ description: 'Number of views', example: 100 })
  @Expose()
  views: number;

  @ApiProperty({ description: 'Creation date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Author information', type: AuthorDto })
  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @ApiProperty({ description: 'Associated tags', type: [TagDto] })
  @Expose()
  @Type(() => TagDto)
  tags: TagDto[];

  @ApiProperty({ description: 'Number of comments', example: 5 })
  @Expose()
  commentsCount: number;
}

