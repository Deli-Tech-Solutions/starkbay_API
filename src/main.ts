// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { VersionMiddleware } from './common/middleware/version.middleware';
import { DeprecationInterceptor} from './common/interceptors/deprecation.interceptor';
import { SecurityHeadersMiddleware } from './security/middleware/security-headers.middleware';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply security headers middleware
  app.use(SecurityHeadersMiddleware);
  
  // Apply other middleware
  app.use(VersionMiddleware);
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new DeprecationInterceptor());

  // Enable validation pipe for input validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }));

  const configV1 = new DocumentBuilder()
    .setTitle('API v1')
    .setDescription('API Version 1 Docs')
    .setVersion('1.0')
    .addTag('users')
    .addBearerAuth()
    .build();

  const configV2 = new DocumentBuilder()
    .setTitle('API v2')
    .setDescription('API Version 2 Docs')
    .setVersion('2.0')
    .addTag('users')
    .addBearerAuth()
    .build();

  const documentV1 = SwaggerModule.createDocument(app, configV1);
  SwaggerModule.setup('api/v1/docs', app, documentV1);

  const documentV2 = SwaggerModule.createDocument(app, configV2);
  SwaggerModule.setup('api/v2/docs', app, documentV2);

  // Enable CORS with security considerations
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  });

  await app.listen(3000);
  console.log('🚀 Application is running on: http://localhost:3000');
  console.log('📚 API Documentation: http://localhost:3000/api/v1/docs');
  console.log('🔒 Security features enabled');
}
bootstrap();