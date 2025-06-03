// src/v2/controllers/user.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDtoV2 } from '../dto/create-user.dto';

@ApiTags('users')
@Controller('v2/users')
export class UserControllerV2 {
  @Get()
  getUsers() {
    return [{ fullName: 'User V2', role: 'admin' }];
  }

  @Post()
  createUser(@Body() body: CreateUserDtoV2) {
    return { message: 'User created (v2)', user: body };
  }
}
