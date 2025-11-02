import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedMetaDto {
  @ApiProperty({ description: 'Total number of items', example: 100 })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  @Expose()
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  @Expose()
  totalPages: number;

  constructor(total: number, page: number, limit: number) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  @Expose()
  @Type(() => Array)
  data: T[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginatedMetaDto })
  @Expose()
  @Type(() => PaginatedMetaDto)
  meta: PaginatedMetaDto;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = new PaginatedMetaDto(total, page, limit);
  }
}

