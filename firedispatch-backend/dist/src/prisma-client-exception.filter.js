"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClientExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const client_1 = require("@prisma/client");
let PrismaClientExceptionFilter = class PrismaClientExceptionFilter extends core_1.BaseExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        console.error('Prisma Exception:', exception.message);
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002': {
                    const status = common_1.HttpStatus.CONFLICT;
                    const message = 'Запись с такими данными уже существует';
                    response.status(status).json({
                        statusCode: status,
                        message,
                    });
                    break;
                }
                case 'P2025': {
                    const status = common_1.HttpStatus.NOT_FOUND;
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
        }
        else if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            const status = common_1.HttpStatus.BAD_REQUEST;
            response.status(status).json({
                statusCode: status,
                message: 'Ошибка валидации данных',
                error: exception.message,
            });
        }
        else {
            super.catch(exception, host);
        }
    }
};
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter;
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError, client_1.Prisma.PrismaClientValidationError)
], PrismaClientExceptionFilter);
//# sourceMappingURL=prisma-client-exception.filter.js.map