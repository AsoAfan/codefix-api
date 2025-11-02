import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Post } from './post.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dtos/createPost.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { QueryPostsDto } from './dtos/query-posts.dto';
import { Tag } from '../tag/tag.entity';
import { User } from '../user/users.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Tag) private tagRepo: Repository<Tag>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async createPost(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const author = await this.userRepo.findOne({ where: { id: authorId } });
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const post = this.postRepo.create({
      title: createPostDto.title,
      body: createPostDto.body,
      author,
      authorId,
    });

    if (createPostDto.tags && createPostDto.tags.length > 0) {
      const tags = await this.tagRepo.find({
        where: { id: In(createPostDto.tags) },
      });
      if (tags.length !== createPostDto.tags.length) {
        throw new BadRequestException('One or more tags not found');
      }
      post.tags = tags;
    }

    return this.postRepo.save(post);
  }

  async getAllPosts(queryDto: QueryPostsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      authorId,
      tagId,
      sortBy = 'createdAt',
      order = 'DESC',
    } = queryDto;

    const queryBuilder = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoin('post.comments', 'comment')
      .loadRelationCountAndMap('post.commentsCount', 'post.comments')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`post.${sortBy}`, order);

    if (search) {
      queryBuilder.where(
        '(post.title ILIKE :search OR post.body ILIKE :search OR post.excerpt ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (authorId) {
      if (search) {
        queryBuilder.andWhere('post.authorId = :authorId', { authorId });
      } else {
        queryBuilder.where('post.authorId = :authorId', { authorId });
      }
    }

    if (tagId) {
      const condition = search || authorId ? 'andWhere' : 'where';
      queryBuilder[condition]('tags.id = :tagId', { tagId });
    }

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPost(id: number): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author', 'tags', 'comments', 'comments.author'],
      order: {
        comments: {
          score: 'DESC',
          createdAt: 'ASC',
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Increment views atomically
    await this.postRepo.increment({ id }, 'views', 1);
    post.views += 1;

    return post;
  }

  async updatePost(
    id: number,
    updatePostDto: UpdatePostDto,
    userId: number,
  ): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['tags'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    // Update basic fields
    if (updatePostDto.title !== undefined) {
      post.title = updatePostDto.title;
    }
    if (updatePostDto.body !== undefined) {
      post.body = updatePostDto.body;
    }

    // Handle tags if provided
    if (updatePostDto.tags !== undefined) {
      if (updatePostDto.tags.length > 0) {
        const tags = await this.tagRepo.find({
          where: { id: In(updatePostDto.tags) },
        });
        if (tags.length !== updatePostDto.tags.length) {
          throw new BadRequestException('One or more tags not found');
        }
        post.tags = tags;
      } else {
        post.tags = [];
      }
    }

    return this.postRepo.save(post);
  }

  async deletePost(id: number, userId: number): Promise<void> {
    const post = await this.postRepo.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postRepo.remove(post);
  }
}
