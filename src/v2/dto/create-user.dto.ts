// src/v2/dto/create-user.dto.ts
export class CreateUserDtoV2 {
  fullName: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}
