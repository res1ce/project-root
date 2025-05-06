import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { FireService } from './fire.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateFireLevelRequirementDto } from './dto/create-firelevel-requirement.dto';

@Controller('fire-level-requirement')
export class FireLevelRequirementController {
  constructor(private readonly fireService: FireService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  getAllRequirements() {
    return this.fireService.getAllRequirements();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  async getRequirementById(@Param('id') id: string) {
    const numId = Number(id);
    if (isNaN(numId)) throw new BadRequestException('Некорректный id');
    const req = await this.fireService.getRequirementById(numId);
    if (!req) throw new NotFoundException(`Требование с id ${id} не найдено`);
    return req;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  createRequirement(@Body() dto: CreateFireLevelRequirementDto) {
    return this.fireService.createRequirement(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  updateRequirement(@Param('id') id: string, @Body() dto: CreateFireLevelRequirementDto) {
    const numId = Number(id);
    if (isNaN(numId)) throw new BadRequestException('Некорректный id');
    return this.fireService.updateRequirement(numId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  deleteRequirement(@Param('id') id: string) {
    const numId = Number(id);
    if (isNaN(numId)) throw new BadRequestException('Некорректный id');
    return this.fireService.deleteRequirement(numId);
  }
} 