// test/user-v2.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('UserControllerV2 (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v2/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v2/users')
      .expect(200)
      .expect(res => {
        expect(res.body[0]).toHaveProperty('fullName');
        expect(res.body[0]).toHaveProperty('role');
      });
  });

  it('/api/v2/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v2/users')
      .send({ fullName: 'Alice', email: 'alice@example.com', role: 'admin' })
      .expect(201)
      .expect(res => {
        expect(res.body.user.fullName).toBe('Alice');
        expect(res.body.user.role).toBe('admin');
      });
  });
});
