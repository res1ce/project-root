import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { FireService } from './fire.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateFireLevelDto } from './dto/create-firelevel.dto';

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
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  createLevel(@Body() dto: CreateFireLevelDto) {
    return this.fireService.createLevel(dto);
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  updateLevel(@Param('id') id: string, @Body() dto: CreateFireLevelDto) {
    return this.fireService.updateLevel(Number(id), dto);
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  deleteLevel(@Param('id') id: string) {
    return this.fireService.deleteLevel(Number(id));
  }
} 