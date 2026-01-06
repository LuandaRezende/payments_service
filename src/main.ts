import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './infrastructure/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './infrastructure/common/interceptors/logging.interceptor';

import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: process.env.ALLOWED_ORIGINS });

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  setupSwagger(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Documentation available at: http://localhost:${port}/api/docs`);
}


function setupSwagger(app: any) {
  const config = new DocumentBuilder()
    .setTitle('Financial Management API')
    .setDescription(
      'RESTful API for billing lifecycle management with Mercado Pago integration. ' +
      'Orchestrated by Temporal.io for high availability and fault tolerance.'
    )
    .setVersion('1.0.0')
    .addTag('Payments', 'Operations related to financial transactions and billing')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      displayRequestDuration: true,
    },
  });
}

bootstrap();