import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreatePostDto } from './dtos/createPost.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { QueryPostsDto } from './dtos/query-posts.dto';
import { PostResponseDto } from './dtos/post-response.dto';
import { PaginatedResponseDto } from './dtos/paginated-response.dto';
import { PostService } from './post.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/users.entity';
import { Public } from '../auth/decorators/public.decorator';
import { plainToInstance } from 'class-transformer';

@ApiTags('posts')
@Controller('posts')
@SerializeOptions({ excludeExtraneousValues: true })
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({
    status: 201,
    description: 'Post successfully created',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ): Promise<PostResponseDto> {
    const post = await this.postService.createPost(createPostDto, user.id);
    return plainToInstance(PostResponseDto, post, {
      excludeExtraneousValues: true,
    });
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all posts with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'List of posts retrieved successfully',
    type: PaginatedResponseDto<PostResponseDto>,
  })
  async getAllPosts(
    @Query() queryDto: QueryPostsDto,
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    const result = await this.postService.getAllPosts(queryDto);
    
    // Map posts and ensure commentsCount is set (from loadRelationCountAndMap)
    const mappedPosts = result.data.map((post: any) => ({
      ...post,
      commentsCount: post.commentsCount ?? 0,
    }));

    return {
      data: plainToInstance(PostResponseDto, mappedPosts, {
        excludeExtraneousValues: true,
      }),
      meta: result.meta,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPost(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PostResponseDto> {
    const post = await this.postService.getPost(id);
    // Map post and ensure commentsCount is set from loaded comments
    const mappedPost = {
      ...post,
      commentsCount: post.comments ? post.comments.length : 0,
    };
    return plainToInstance(PostResponseDto, mappedPost, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', type: 'number', description: 'Post ID' })
  @ApiBody({ type: UpdatePostDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Post successfully updated',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the post owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: User,
  ): Promise<PostResponseDto> {
    const post = await this.postService.updatePost(id, updatePostDto, user.id);
    return plainToInstance(PostResponseDto, post, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', type: 'number', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the post owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.postService.deletePost(id, user.id);
  }
}
