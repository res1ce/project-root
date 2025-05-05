"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireEngineModule = void 0;
const common_1 = require("@nestjs/common");
const fire_engine_service_1 = require("./fire-engine.service");
const fire_engine_controller_1 = require("./fire-engine.controller");
const engine_type_controller_1 = require("./engine-type.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let FireEngineModule = class FireEngineModule {
};
exports.FireEngineModule = FireEngineModule;
exports.FireEngineModule = FireEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [fire_engine_service_1.FireEngineService],
        controllers: [fire_engine_controller_1.FireEngineController, engine_type_controller_1.EngineTypeController]
    })
], FireEngineModule);
//# sourceMappingURL=fire-engine.module.js.map