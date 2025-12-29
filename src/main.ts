import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './infrastructure/common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança
  app.use(helmet());
  app.enableCors({ origin: process.env.ALLOWED_ORIGINS });

  // Tratamento de Erros Global
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Validação Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Remove propriedades que não estão no DTO (segurança)
      forbidNonWhitelisted: true,  // Lança erro se propriedades extras forem enviadas
      transform: true,             // Transforma os tipos dos dados (ex: string para number)
      transformOptions: {
        enableImplicitConversion: true, // Permite conversões implícitas baseadas no tipo do TS
      },
    }),
  );

  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();