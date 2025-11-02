import {
  IsNotEmpty,
  IsString,
  IsInt,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a helpful comment addressing the question.',
    minLength: 1,
  })
  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  @MinLength(1, { message: 'Content must not be empty' })
  content: string;

  @ApiProperty({
    description: 'ID of the post to comment on',
    example: 1,
    type: Number,
  })
  @IsNotEmpty({ message: 'Post ID is required' })
  @Type(() => Number)
  @IsInt({ message: 'Post ID must be an integer' })
  postId: number;
}

