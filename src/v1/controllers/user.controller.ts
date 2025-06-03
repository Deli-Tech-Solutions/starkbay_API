// src/v1/controllers/user.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDtoV1 } from '../dto/create-user.dto';

@ApiTags('users')
@Controller('v1/users')
export class UserControllerV1 {
  @Get()
  getUsers() {
    return [{ name: 'User V1' }];
  }

  @Post()
  createUser(@Body() body: CreateUserDtoV1) {
    return { message: 'User created (v1)', user: body };
  }
}
