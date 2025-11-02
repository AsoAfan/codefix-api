import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Content of the comment',
    example: 'Updated comment content',
    required: false,
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;
}

