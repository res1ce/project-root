import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { FireService } from './fire.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('fire-level')
export class FireLevelController {
  constructor(private readonly fireService: FireService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getAllLevels() {
    return this.fireService.getAllLevels();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  async getLevelById(@Param('id') id: string) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) throw new BadRequestException('Некорректный id');
    const level = await this.fireService.getLevelById(numId);
    if (!level) throw new NotFoundException(`Уровень с id ${id} не найден`);
    return level;
  }
} 