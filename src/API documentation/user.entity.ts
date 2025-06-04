import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'The username of the user',
  })
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email address of the user',
  })
  email: string;

  @ApiProperty({
    example: false,
    description: 'Whether the user is an admin',
  })
  isAdmin: boolean;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'The date when the user was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'The date when the user was last updated',
  })
  updatedAt: Date;
}