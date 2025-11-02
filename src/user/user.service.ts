import { Injectable } from '@nestjs/common';
import { createUserDto } from './dtos/createUser.dto';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  createUser(userData: createUserDto) {
    return this.repo.save(userData);
  }
}
