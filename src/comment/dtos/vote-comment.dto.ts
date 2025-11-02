import { IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VoteType } from '../../vote/vote.entity';

export class VoteCommentDto {
  @ApiProperty({
    description: 'Vote type',
    enum: VoteType,
    example: VoteType.UPVOTE,
  })
  @IsNotEmpty()
  @IsEnum(VoteType)
  type: VoteType;
}

