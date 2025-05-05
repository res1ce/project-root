"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const core_2 = require("@nestjs/core");
const prisma_client_exception_filter_1 = require("./prisma-client-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: ['http://localhost:3001', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true }));
    const { httpAdapter } = app.get(core_2.HttpAdapterHost);
    app.useGlobalFilters(new prisma_client_exception_filter_1.PrismaClientExceptionFilter(httpAdapter));
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map