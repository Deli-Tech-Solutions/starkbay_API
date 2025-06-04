// test/user-v1.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('UserControllerV1 (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(200)
      .expect(res => {
        expect(res.body[0]).toHaveProperty('name');
      });
  });

  it('/api/v1/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201)
      .expect(res => {
        expect(res.body.user.name).toBe('John');
      });
  });
});
