import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({
    description: 'Title of the post',
    example: 'Updated title',
    required: false,
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiProperty({
    description: 'Content/body of the post',
    example: 'Updated content...',
    required: false,
    minLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  body?: string;

  @ApiProperty({
    description: 'Array of tag IDs to associate with the post',
    example: [1, 2],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tags?: number[];
}

