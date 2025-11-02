import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { createUserDto } from './dtos/createUser.dto';
import { User } from './users.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() userData: createUserDto) {
    const user: User = await this.userService.createUser(userData);
  }
}
