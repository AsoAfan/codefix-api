# CodFix API

A comprehensive RESTful API built with NestJS for a Q&A and Blog Platform similar to Stack Overflow. This API supports user authentication, post management, comments (answers), voting system, and tag categorization.

## Features

- **JWT Authentication & Authorization** - Secure user authentication with role-based access control
- **Post Management** - Create, read, update, and delete blog posts/questions
- **Comment System** - Comments serve as answers/responses to posts
- **Voting System** - Upvote/downvote comments with automatic score calculation
- **Tag System** - Categorize posts with tags
- **Pagination & Filtering** - Efficient data retrieval with search, filtering, and sorting
- **API Documentation** - Interactive Swagger/OpenAPI documentation
- **Comprehensive Testing** - Unit and E2E tests with high coverage

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

## Prerequisites

- Node.js (v18 or higher)
- pnpm (or npm/yarn)
- PostgreSQL (v12 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AsoAfan/codefix-api.git
cd codfix-api
```

2. Install dependencies:
```bash
pnpm install
```

3. Update db credientials in `app.module.ts`

4. Create PostgreSQL database

5. Run the application:
```bash
# Development mode with hot-reload
pnpm start:dev
```

The application will start on `http://localhost:3000`.

## API Documentation (Swagger)

Once the application is running, access the interactive API documentation at:

**http://localhost:3000/api**

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive testing interface (Try it out)
- Request/response schemas
- Authentication support (click "Authorize" button)
- Example requests and responses

### Using Swagger:

1. Open `http://localhost:3000/api` in your browser
2. Click the **"Authorize"** button at the top
3. For public endpoints (register/login), you can test without authentication
4. For protected endpoints, register/login first to get a JWT token, then:
   - Click "Authorize"
   - Enter: `Bearer <your-jwt-token>`
   - Click "Authorize" to save
5. Now you can test protected endpoints directly from Swagger

## API Endpoints

### Authentication (`/auth`)

- `POST /auth/register` - Register a new user (Public)
  - Body: `{ username, email, password }`
  - Returns: `{ access_token, user }`

- `POST /auth/login` - Login user (Public)
  - Body: `{ email, password }`
  - Returns: `{ access_token, user }`

### Posts (`/posts`)

- `POST /posts` - Create a new post (Auth required)
  - Body: `{ title, body, tags?: number[] }`
  
- `GET /posts` - Get all posts with pagination (Public)
  - Query params: `page`, `limit`, `search`, `authorId`, `tagId`, `sortBy`, `order`
  - Returns: Paginated response with metadata

- `GET /posts/:id` - Get a single post (Public)
  - Automatically increments view count

- `PATCH /posts/:id` - Update a post (Auth required, owner only)
  - Body: `{ title?, body?, tags? }`

- `DELETE /posts/:id` - Delete a post (Auth required, owner only)

### Comments (`/comments`)

- `POST /comments` - Create a comment/answer (Auth required)
  - Body: `{ postId, content }`

- `GET /comments/post/:postId` - Get all comments for a post (Public)
  - Returns: Comments sorted by score (descending)

- `PATCH /comments/:id` - Update a comment (Auth required, owner only)
  - Body: `{ content }`

- `DELETE /comments/:id` - Delete a comment (Auth required, owner only)

- `POST /comments/:id/vote` - Vote on a comment (Auth required)
  - Body: `{ type: 'upvote' | 'downvote' }`
  - Toggles vote if same type is applied again

- `DELETE /comments/:id/vote` - Remove vote from comment (Auth required)

## Testing

### Run All Tests

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:cov

# Run E2E tests
pnpm test:e2e
```

### Test Structure

- **Unit Tests** (`src/**/*.spec.ts`):
  - Service layer tests with mocked dependencies
  - Controller layer tests
  - Test all business logic and error handling

- **E2E Tests** (`test/*.e2e-spec.ts`):
  - Full integration tests with real database
  - Test complete request/response cycles
  - Test authentication flows
  - Test error scenarios and edge cases

### Test Coverage

The test suite covers:
- All endpoints (auth, posts, comments)
- Authentication and authorization
- Validation and error handling
- Business logic (voting, pagination, filtering)
- Edge cases and error scenarios

## Database Schema

### Entities

- **User**: Users with authentication, reputation, profile info
- **Post**: Blog posts/questions with title, body, tags, views
- **Comment**: Comments/answers on posts with voting scores
- **Vote**: Individual votes on comments (upvote/downvote)
- **Tag**: Tags for categorizing posts

### Relationships

- User → Posts (One-to-Many)
- User → Comments (One-to-Many)
- User → Votes (One-to-Many)
- Post → Comments (One-to-Many)
- Post → Tags (Many-to-Many)
- Comment → Votes (One-to-Many)

## Project Structure

```
src/
├── auth/              # Authentication module
│   ├── decorators/    # @CurrentUser, @Public, @Roles
│   ├── dtos/          # Register, Login DTOs
│   ├── guards/        # JWT auth guard, Roles guard
│   ├── strategies/    # JWT strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── user/              # User module
│   ├── dtos/          # User DTOs
│   ├── users.entity.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── user.module.ts
├── post/              # Post module
│   ├── dtos/          # Post DTOs (create, update, query, response)
│   ├── post.entity.ts
│   ├── post.controller.ts
│   ├── post.service.ts
│   └── post.module.ts
├── comment/           # Comment module
│   ├── dtos/          # Comment DTOs
│   ├── comment.entity.ts
│   ├── comment.controller.ts
│   ├── comment.service.ts
│   └── comment.module.ts
├── vote/              # Vote module
│   ├── vote.entity.ts
│   └── vote.module.ts
├── tag/               # Tag module
│   ├── tag.entity.ts
│   └── tag.module.ts
├── app.module.ts      # Root module
└── main.ts            # Application entry point

test/
├── helpers/           # Test utilities
├── auth.e2e-spec.ts   # Auth E2E tests
├── posts.e2e-spec.ts  # Posts E2E tests
└── comments.e2e-spec.ts # Comments E2E tests
```

## Development

### Code Style

The project uses:
- ESLint for code linting
- Prettier for code formatting

```bash
# Format code
pnpm format

# Lint code
pnpm lint
```

### Environment Setup

Make sure your PostgreSQL database is running and accessible with the credentials specified in your `.env` file or `app.module.ts`.

The application uses TypeORM with `synchronize: true` in development mode, which automatically creates/updates database tables based on your entities.

**Warning**: Set `synchronize: false` in production and use migrations instead.

## API Usage Examples

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

Save the `access_token` from the response.

### 3. Create a Post

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "How to use NestJS?",
    "body": "This is a detailed explanation of how to use NestJS...",
    "tags": [1, 2]
  }'
```

### 4. Get All Posts (with pagination)

```bash
curl "http://localhost:3000/posts?page=1&limit=10&search=nestjs"
```

### 5. Create a Comment

```bash
curl -X POST http://localhost:3000/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "postId": 1,
    "content": "This is a helpful answer/comment"
  }'
```

### 6. Vote on a Comment

```bash
curl -X POST http://localhost:3000/comments/1/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "upvote"
  }'
```

## Best Practices Implemented

- **Validation**: All inputs validated with class-validator
- **Error Handling**: Proper HTTP status codes and error messages
- **Security**: Password hashing with bcrypt, JWT authentication
- **Authorization**: Ownership checks for update/delete operations
- **Response DTOs**: Consistent API response structure
- **Pagination**: Efficient data retrieval with metadata
- **Transactions**: Database transactions for vote operations
- **Type Safety**: Full TypeScript support
- **Documentation**: Comprehensive Swagger documentation
- **Testing**: Unit and E2E tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
