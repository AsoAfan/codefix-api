import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the post',
    example: 'How to implement authentication in NestJS',
    minLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({
    description: 'Content/body of the post',
    example: 'This is a detailed explanation of how to implement authentication...',
    minLength: 10,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  body: string;

  @ApiProperty({
    description: 'Array of tag IDs to associate with the post',
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tags?: number[];
}