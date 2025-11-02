import { IsOptional, IsInt, IsString, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPostsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term for title, body, or excerpt',
    example: 'nestjs',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by author ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  authorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by tag ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tagId?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['createdAt', 'views', 'title'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'views', 'title'])
  sortBy?: 'createdAt' | 'views' | 'title' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

