import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

export class TestHelpers {
  static async createTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    
    // Apply global pipes (same as main.ts)
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
    return app;
  }

  static async cleanupDatabase(app: INestApplication): Promise<void> {
    const dataSource = app.get(DataSource);
    const entities = dataSource.entityMetadatas;

    // Delete in reverse order to respect foreign key constraints
    const deleteOrder = ['votes', 'comments', 'post_tags', 'posts', 'tags', 'users'];

    for (const tableName of deleteOrder) {
      try {
        await dataSource.query(`DELETE FROM "${tableName}"`);
      } catch (error) {
        // Ignore if table doesn't exist or error occurs
      }
    }
  }

  static async registerUser(
    app: INestApplication,
    userData: {
      username?: string;
      email?: string;
      password?: string;
    } = {},
  ): Promise<{ user: any; accessToken: string }> {
    const defaultUser = {
      username: userData.username || 'testuser',
      email: userData.email || 'test@example.com',
      password: userData.password || 'password123',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(defaultUser)
      .expect(201);

    return {
      user: response.body.user,
      accessToken: response.body.access_token,
    };
  }

  static async loginUser(
    app: INestApplication,
    email: string = 'test@example.com',
    password: string = 'password123',
  ): Promise<{ user: any; accessToken: string }> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    return {
      user: response.body.user,
      accessToken: response.body.access_token,
    };
  }

  static async createPost(
    app: INestApplication,
    accessToken: string,
    postData: {
      title?: string;
      body?: string;
      tags?: number[];
    } = {},
  ): Promise<any> {
    const defaultPost = {
      title: postData.title || 'Test Post Title',
      body: postData.body || 'This is a test post body content with enough characters',
      tags: postData.tags || [],
    };

    const response = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(defaultPost)
      .expect(201);

    return response.body;
  }

  static async createComment(
    app: INestApplication,
    accessToken: string,
    postId: number,
    content: string = 'Test comment content',
  ): Promise<any> {
    const response = await request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ postId, content })
      .expect(201);

    return response.body;
  }
}

