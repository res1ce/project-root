import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    console.error('Prisma Exception:', exception.message);
    
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          // Уникальное ограничение
          const status = HttpStatus.CONFLICT;
          const message = 'Запись с такими данными уже существует';
          
          response.status(status).json({
            statusCode: status,
            message,
          });
          break;
        }
        case 'P2025': {
          // Запись не найдена
          const status = HttpStatus.NOT_FOUND;
          const message = 'Запись не найдена';
          
          response.status(status).json({
            statusCode: status,
            message,
          });
          break;
        }
        default:
          super.catch(exception, host);
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      // Ошибка валидации
      const status = HttpStatus.BAD_REQUEST;
      
      response.status(status).json({
        statusCode: status,
        message: 'Ошибка валидации данных',
        error: exception.message,
      });
    } else {
      super.catch(exception, host);
    }
  }
} 