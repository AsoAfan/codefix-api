import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './helpers/test-helpers';
import { DataSource } from 'typeorm';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let user1Token: string;
  let user2Token: string;
  let user1Id: number;
  let user2Id: number;

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

    // Create two users for testing
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/posts (POST)', () => {
    it('should create a post successfully', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test Post',
          body: 'This is a test post body with enough characters',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', 'Test Post');
          expect(res.body).toHaveProperty('body');
          expect(res.body).toHaveProperty('author');
          expect(res.body.author.id).toBe(user1Id);
          expect(res.body.views).toBe(0);
        });
    });

    it('should create a post with tags', async () => {
      // Create a tag first
      const { Tag } = await import('../src/tag/tag.entity');
      const tagRepo = dataSource.getRepository(Tag);
      const tag = await tagRepo.save({
        name: 'nestjs',
        description: 'NestJS framework',
      });

      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'NestJS Post',
          body: 'This is a post about NestJS with enough characters',
          tags: [tag.id],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.tags).toHaveLength(1);
          expect(res.body.tags[0].name).toBe('nestjs');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Test Post',
          body: 'This is a test post body with enough characters',
        })
        .expect(401);
    });

    it('should fail with short title', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'AB',
          body: 'This is a test post body with enough characters',
        })
        .expect(400);
    });

    it('should fail with short body', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test Post',
          body: 'short',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test Post',
        })
        .expect(400);
    });
  });

  describe('/posts (GET)', () => {
    beforeEach(async () => {
      // Create some posts
      await TestHelpers.createPost(app, user1Token, {
        title: 'Post 1',
        body: 'Content for post 1 with enough characters',
      });
      await TestHelpers.createPost(app, user2Token, {
        title: 'Post 2',
        body: 'Content for post 2 with enough characters',
      });
    });

    it('should get all posts without authentication', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.data).toHaveLength(2);
          expect(res.body.meta.total).toBe(2);
          expect(res.body.meta.page).toBe(1);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/posts?page=1&limit=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.meta.limit).toBe(1);
          expect(res.body.meta.totalPages).toBe(2);
        });
    });

    it('should filter by authorId', () => {
      return request(app.getHttpServer())
        .get(`/posts?authorId=${user1Id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].author.id).toBe(user1Id);
        });
    });

    it('should search posts', () => {
      return request(app.getHttpServer())
        .get('/posts?search=Post 1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(
            res.body.data.some((post: any) => post.title.includes('Post 1')),
          ).toBe(true);
        });
    });

    it('should sort posts', () => {
      return request(app.getHttpServer())
        .get('/posts?sortBy=createdAt&order=ASC')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/posts/:id (GET)', () => {
    let postId: number;

    beforeEach(async () => {
      const post = await TestHelpers.createPost(app, user1Token, {
        title: 'Single Post',
        body: 'This is a single post content with enough characters',
      });
      postId = post.id;
    });

    it('should get a single post without authentication', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', postId);
          expect(res.body).toHaveProperty('title', 'Single Post');
          expect(res.body).toHaveProperty('author');
          expect(res.body).toHaveProperty('comments');
          expect(res.body.views).toBeGreaterThanOrEqual(0);
        });
    });

    it('should increment views on each request', async () => {
      const firstRequest = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      const firstViews = firstRequest.body.views;

      const secondRequest = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(secondRequest.body.views).toBe(firstViews + 1);
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .get('/posts/99999')
        .expect(404);
    });
  });

  describe('/posts/:id (PATCH)', () => {
    let postId: number;

    beforeEach(async () => {
      const post = await TestHelpers.createPost(app, user1Token, {
        title: 'Original Title',
        body: 'Original body content with enough characters',
      });
      postId = post.id;
    });

    it('should update post successfully', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Updated Title',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Title');
          expect(res.body.body).toBeDefined();
        });
    });

    it('should update post body', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          body: 'Updated body content with enough characters',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.body).toBe('Updated body content with enough characters');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({
          title: 'Updated Title',
        })
        .expect(401);
    });

    it('should fail if user is not the owner', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Updated Title',
        })
        .expect(403);
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .patch('/posts/99999')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Updated Title',
        })
        .expect(404);
    });

    it('should fail with validation errors', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'AB',
        })
        .expect(400);
    });
  });

  describe('/posts/:id (DELETE)', () => {
    let postId: number;

    beforeEach(async () => {
      const post = await TestHelpers.createPost(app, user1Token, {
        title: 'Post to Delete',
        body: 'This post will be deleted with enough characters',
      });
      postId = post.id;
    });

    it('should delete post successfully', () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .expect(401);
    });

    it('should fail if user is not the owner', () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .delete('/posts/99999')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('should verify post is actually deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      return request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(404);
    });
  });
});

