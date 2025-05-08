import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Устанавливаем глобальный префикс для всех маршрутов
  app.setGlobalPrefix('api');
  
  // Включаем CORS для фронтенда
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // Добавляем глобальный фильтр исключений для Prisma
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
  
  // Логгирование запросов и ошибок
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
    const oldSend = res.send;
    res.send = function(data: any) {
      if (res.statusCode >= 400) {
        console.error(`Error response [${res.statusCode}]: ${data}`);
      }
      return oldSend.call(this, data);
    };
    next();
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
