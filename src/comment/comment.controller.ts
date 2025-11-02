import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
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
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dtos/createComment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { VoteCommentDto } from './dtos/vote-comment.dto';
import { CommentResponseDto } from './dtos/comment-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/users.entity';
import { Public } from '../auth/decorators/public.decorator';
import { plainToInstance } from 'class-transformer';

@ApiTags('comments')
@Controller('comments')
@SerializeOptions({ excludeExtraneousValues: true })
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({
    status: 201,
    description: 'Comment successfully created',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentService.createComment(
      createCommentDto,
      user.id,
    );
    return plainToInstance(CommentResponseDto, comment, {
      excludeExtraneousValues: true,
    });
  }

  @Public()
  @Get('post/:postId')
  @ApiOperation({ summary: 'Get all comments for a specific post' })
  @ApiParam({
    name: 'postId',
    type: 'number',
    description: 'ID of the post',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: [CommentResponseDto],
  })
  async getCommentsByPost(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<CommentResponseDto[]> {
    const comments = await this.commentService.findAllByPost(postId);
    return plainToInstance(CommentResponseDto, comments, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', type: 'number', description: 'Comment ID' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({
    status: 200,
    description: 'Comment successfully updated',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the comment owner',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: User,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentService.updateComment(
      id,
      updateCommentDto,
      user.id,
    );
    return plainToInstance(CommentResponseDto, comment, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', type: 'number', description: 'Comment ID' })
  @ApiResponse({ status: 204, description: 'Comment successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the comment owner',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.commentService.deleteComment(id, user.id);
  }

  @Post(':id/vote')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Vote on a comment (upvote or downvote)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Comment ID' })
  @ApiBody({ type: VoteCommentDto })
  @ApiResponse({
    status: 200,
    description: 'Vote successfully recorded',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async voteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() voteDto: VoteCommentDto,
    @CurrentUser() user: User,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentService.voteComment(
      commentId,
      voteDto,
      user.id,
    );
    return plainToInstance(CommentResponseDto, comment, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id/vote')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove vote from a comment' })
  @ApiParam({ name: 'id', type: 'number', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'Vote successfully removed',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vote or comment not found' })
  async removeVote(
    @Param('id', ParseIntPipe) commentId: number,
    @CurrentUser() user: User,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentService.removeVote(commentId, user.id);
    return plainToInstance(CommentResponseDto, comment, {
      excludeExtraneousValues: true,
    });
  }
}
