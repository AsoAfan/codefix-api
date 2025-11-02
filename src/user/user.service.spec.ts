import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './users.entity';
import { createUserDto } from './dtos/createUser.dto';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userDto: createUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const savedUser = { id: 1, ...userDto };

      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.createUser(userDto);

      expect(mockRepository.save).toHaveBeenCalledWith(userDto);
      expect(result).toEqual(savedUser);
    });
  });
});
