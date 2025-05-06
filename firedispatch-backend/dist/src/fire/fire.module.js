"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireModule = void 0;
const common_1 = require("@nestjs/common");
const fire_controller_1 = require("./fire.controller");
const fire_service_1 = require("./fire.service");
const fire_events_gateway_1 = require("./fire-events.gateway");
const user_module_1 = require("../user/user.module");
const prisma_module_1 = require("../prisma/prisma.module");
const fire_level_controller_1 = require("./fire-level.controller");
const fire_level_requirement_controller_1 = require("./fire-level-requirement.controller");
let FireModule = class FireModule {
};
exports.FireModule = FireModule;
exports.FireModule = FireModule = __decorate([
    (0, common_1.Module)({
        imports: [user_module_1.UserModule, prisma_module_1.PrismaModule],
        controllers: [fire_controller_1.FireController, fire_level_controller_1.FireLevelController, fire_level_requirement_controller_1.FireLevelRequirementController],
        providers: [fire_service_1.FireService, fire_events_gateway_1.FireEventsGateway],
        exports: [fire_service_1.FireService, fire_events_gateway_1.FireEventsGateway]
    })
], FireModule);
//# sourceMappingURL=fire.module.js.map