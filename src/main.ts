// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { VersionMiddleware } from './common/middleware/version.middleware';
import { DeprecationInterceptor} from './common/interceptors/deprecation.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(VersionMiddleware);
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new DeprecationInterceptor());

  const configV1 = new DocumentBuilder()
    .setTitle('API v1')
    .setDescription('API Version 1 Docs')
    .setVersion('1.0')
    .addTag('users')
    .build();

  const configV2 = new DocumentBuilder()
    .setTitle('API v2')
    .setDescription('API Version 2 Docs')
    .setVersion('2.0')
    .addTag('users')
    .build();

  const documentV1 = SwaggerModule.createDocument(app, configV1);
  SwaggerModule.setup('api/v1/docs', app, documentV1);

  const documentV2 = SwaggerModule.createDocument(app, configV2);
  SwaggerModule.setup('api/v2/docs', app, documentV2);

  await app.listen(3000);
}
bootstrap();