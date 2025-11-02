import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/users.entity';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { username: registerDto.username }],
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === registerDto.username) {
        throw new ConflictException('Username already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      role: 'user',
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
    };

    const accessToken = this.jwtService.sign(payload);

    return new AuthResponseDto(accessToken, savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);

    return new AuthResponseDto(accessToken, user);
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}

