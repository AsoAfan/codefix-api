import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vote])],
  exports: [TypeOrmModule],
})
export class VoteModule {}

