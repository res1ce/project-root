import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Устанавливаем глобальный префикс для всех маршрутов
  app.setGlobalPrefix('api');
  
  // Включаем CORS для фронтенда
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // Добавляем глобальный фильтр исключений для Prisma
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
