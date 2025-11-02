import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @Expose()
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User role', example: 'user', enum: ['user', 'admin'] })
  @Expose()
  role: string;

  constructor(partial: Partial<any>) {
    Object.assign(this, partial);
  }
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  access_token: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  @Expose()
  user: UserResponseDto;

  constructor(accessToken: string, user: any) {
    this.access_token = accessToken;
    this.user = new UserResponseDto(user);
  }
}

