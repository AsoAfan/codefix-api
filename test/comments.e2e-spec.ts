import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './helpers/test-helpers';
import { DataSource } from 'typeorm';

describe('CommentsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let user1Token: string;
  let user2Token: string;
  let user1Id: number;
  let user2Id: number;
  let postId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new (await import('@nestjs/common')).ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await TestHelpers.cleanupDatabase(app);

    // Create two users
    const user1 = await TestHelpers.registerUser(app, {
      username: 'user1',
      email: 'user1@example.com',
    });
    user1Token = user1.accessToken;
    user1Id = user1.user.id;

    const user2 = await TestHelpers.registerUser(app, {
      username: 'user2',
      email: 'user2@example.com',
    });
    user2Token = user2.accessToken;
    user2Id = user2.user.id;

    // Create a post
    const post = await TestHelpers.createPost(app, user1Token, {
      title: 'Test Post',
      body: 'This is a test post body with enough characters',
    });
    postId = post.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/comments (POST)', () => {
    it('should create a comment successfully', () => {
      return request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          postId,
          content: 'This is a test comment',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('content', 'This is a test comment');
          expect(res.body).toHaveProperty('author');
          expect(res.body.author.id).toBe(user1Id);
          expect(res.body).toHaveProperty('score', 0);
          expect(res.body).toHaveProperty('postId', postId);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/comments')
        .send({
          postId,
          content: 'This is a test comment',
        })
        .expect(401);
    });

    it('should fail with non-existent post', () => {
      return request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          postId: 99999,
          content: 'This is a test comment',
        })
        .expect(404);
    });

    it('should fail with empty content', () => {
      return request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          postId,
          content: '',
        })
        .expect(400);
    });

    it('should fail with missing postId', () => {
      return request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'This is a test comment',
        })
        .expect(400);
    });
  });

  describe('/comments/post/:postId (GET)', () => {
    beforeEach(async () => {
      // Create multiple comments
      await TestHelpers.createComment(app, user1Token, postId, 'Comment 1');
      await TestHelpers.createComment(app, user2Token, postId, 'Comment 2');
    });

    it('should get all comments for a post without authentication', () => {
      return request(app.getHttpServer())
        .get(`/comments/post/${postId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0]).toHaveProperty('content');
          expect(res.body[0]).toHaveProperty('author');
          expect(res.body[0]).toHaveProperty('score');
        });
    });

    it('should return empty array for post with no comments', () => {
      const newPost = TestHelpers.createPost(app, user1Token, {
        title: 'Empty Post',
        body: 'This post has no comments with enough characters',
      });

      return request(app.getHttpServer())
        .get(`/comments/post/${postId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should sort comments by score descending', async () => {
      // Create comments with different scores by voting
      const comment1 = await TestHelpers.createComment(
        app,
        user1Token,
        postId,
        'Comment with votes',
      );
      const comment2 = await TestHelpers.createComment(
        app,
        user2Token,
        postId,
        'Comment without votes',
      );

      // Upvote comment1
      await request(app.getHttpServer())
        .post(`/comments/${comment1.id}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ type: 'upvote' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/comments/post/${postId}`)
        .expect(200);

      // First comment should have higher score
      expect(response.body[0].score).toBeGreaterThanOrEqual(
        response.body[1].score,
      );
    });
  });

  describe('/comments/:id (PATCH)', () => {
    let commentId: number;

    beforeEach(async () => {
      const comment = await TestHelpers.createComment(
        app,
        user1Token,
        postId,
        'Original comment',
      );
      commentId = comment.id;
    });

    it('should update comment successfully', () => {
      return request(app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'Updated comment',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.content).toBe('Updated comment');
          expect(res.body).toHaveProperty('id', commentId);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .send({
          content: 'Updated comment',
        })
        .expect(401);
    });

    it('should fail if user is not the owner', () => {
      return request(app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          content: 'Updated comment',
        })
        .expect(403);
    });

    it('should return 404 for non-existent comment', () => {
      return request(app.getHttpServer())
        .patch('/comments/99999')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'Updated comment',
        })
        .expect(404);
    });

    it('should fail with empty content', () => {
      return request(app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: '',
        })
        .expect(400);
    });
  });

  describe('/comments/:id (DELETE)', () => {
    let commentId: number;

    beforeEach(async () => {
      const comment = await TestHelpers.createComment(
        app,
        user1Token,
        postId,
        'Comment to delete',
      );
      commentId = comment.id;
    });

    it('should delete comment successfully', () => {
      return request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .expect(401);
    });

    it('should fail if user is not the owner', () => {
      return request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('should return 404 for non-existent comment', () => {
      return request(app.getHttpServer())
        .delete('/comments/99999')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('should verify comment is actually deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get(`/comments/post/${postId}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });
  });

  describe('/comments/:id/vote (POST)', () => {
    let commentId: number;

    beforeEach(async () => {
      const comment = await TestHelpers.createComment(
        app,
        user1Token,
        postId,
        'Comment to vote on',
      );
      commentId = comment.id;
    });

    it('should upvote comment successfully', () => {
      return request(app.getHttpServer())
        .post(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          type: 'upvote',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.score).toBe(1);
        });
    });

    it('should downvote comment successfully', () => {
      return request(app.getHttpServer())
        .post(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          type: 'downvote',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.score).toBe(-1);
        });
    });

    it('should toggle vote off if same vote is applied again', async () => {
      // First upvote
      await request(app.getHttpServer())
        .post(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ type: 'upvote' })
        .expect(200);

      // Upvote again (should remove vote)
      return request(app.getHttpServer())
        .post(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ type: 'upvote' })
        .expect(200)
        .expect((res) => {
          expect(res.body.score).toBe(0);
        });
    });

    it('should change vote from upvote to downvote', async () => {
      // First upvote
      await request(app.getHttpServer())
        .post(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ type: 'upvote' })
        .expect(200);

      // Change to downvote
      return request(app.getHttpServer())
        .post(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ type: 'downvote' })
        .expect(200)
        .expect((res) => {
          expect(res.body.score).toBe(-1);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post(`/comments/${commentId}/vote`)
        .send({
          type: 'upvote',
        })
        .expect(401);
    });

    it('should return 404 for non-existent comment', () => {
      return request(app.getHttpServer())
        .post('/comments/99999/vote')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          type: 'upvote',
        })
        .expect(404);
    });

    it('should fail with invalid vote type', () => {
      return request(app.getHttpServer())
        .post(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          type: 'invalid',
        })
        .expect(400);
    });
  });

  describe('/comments/:id/vote (DELETE)', () => {
    let commentId: number;

    beforeEach(async () => {
      const comment = await TestHelpers.createComment(
        app,
        user1Token,
        postId,
        'Comment to remove vote from',
      );
      commentId = comment.id;

      // Create a vote first
      await request(app.getHttpServer())
        .post(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ type: 'upvote' })
        .expect(200);
    });

    it('should remove vote successfully', () => {
      return request(app.getHttpServer())
        .delete(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.score).toBe(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/comments/${commentId}/vote`)
        .expect(401);
    });

    it('should return 404 if vote does not exist', () => {
      return request(app.getHttpServer())
        .delete(`/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('should return 404 for non-existent comment', () => {
      return request(app.getHttpServer())
        .delete('/comments/99999/vote')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });
  });
});

