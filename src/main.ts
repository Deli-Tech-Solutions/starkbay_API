// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { VersionMiddleware } from './common/middleware/version.middleware';
import { DeprecationInterceptor } from './common/interceptors/deprecation.interceptor';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerOptions } from './logger';

// Simple security headers middleware
function SecurityHeadersMiddleware(req: any, res: any, next: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLoggerOptions),
  });

  // Apply security headers middleware
  app.use(SecurityHeadersMiddleware);

  // Apply other middleware
  app.use(VersionMiddleware);
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new DeprecationInterceptor());

  // Enable validation pipe for input validation with class-validator
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
    validateCustomDecorators: true,
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
  console.log('🗃️  Database validation enabled with class-validator');
}
bootstrap();
