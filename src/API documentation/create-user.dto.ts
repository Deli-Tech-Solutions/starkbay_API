import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'The username of the user',
    minLength: 4,
    maxLength: 20,
  })
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email address of the user',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    example: 'securePassword123!',
    description: 'The password of the user',
    minLength: 8,
    format: 'password',
  })
  password: string;

  @ApiProperty({
    example: false,
    description: 'Whether the user is an admin',
    required: false,
    default: false,
  })
  isAdmin?: boolean;
}