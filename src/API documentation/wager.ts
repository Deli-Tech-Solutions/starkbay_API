import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { version } from '../package.json';

/**
 * Configures and initializes Swagger documentation for the application
 * @param app The NestJS application instance
 */
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Comprehensive API documentation with interactive testing')
    .setVersion(version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name should match the one used in @ApiBearerAuth()
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'API key for external access',
      },
      'api-key',
    )
    .addCookieAuth('session-id')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Setup the Swagger UI
  SwaggerModule.setup('api-docs', app, document, {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      persistAuthorization: true,
      displayOperationId: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'API Documentation',
    customCss: '.topbar { display: none }',
    customfavIcon: '/favicon.ico',
  });

  // Export documentation as JSON
  app.use('/api-docs-json', (req, res) => {
    res.json(document);
  });
}