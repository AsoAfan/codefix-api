import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/users.entity';
import { Post } from './post/post.entity';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { Comment } from './comment/comment.entity';
import { Vote } from './vote/vote.entity';
import { Tag } from './tag/tag.entity';
import { VoteModule } from './vote/vote.module';
import { TagModule } from './tag/tag.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'aso123456',
      database: 'codefix',
      synchronize: true,
      entities: [User, Post, Comment, Vote, Tag],
    }),
    PostModule,
    CommentModule,
    VoteModule,
    TagModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
