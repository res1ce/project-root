import { Controller, Post, Body, UseGuards, BadRequestException, Get, Param, Put, Delete, Req } from '@nestjs/common';
import { FireEngineService } from './fire-engine.service';
import { CreateFireEngineDto } from './dto/create-fire-engine.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('fire-engine')
export class FireEngineController {
  constructor(private readonly fireEngineService: FireEngineService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'station_dispatcher')
  @Post()
  async create(@Body() dto: CreateFireEngineDto, @Req() req: RequestWithUser) {
    try {
      // Если запрос от диспетчера части, устанавливаем fireStationId в его часть
      if (req.user.role === 'station_dispatcher' && req.user.fireStationId) {
        dto.fireStationId = req.user.fireStationId;
      }
      return await this.fireEngineService.create(dto);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Req() req: RequestWithUser) {
    // Если запрос от диспетчера части, возвращаем только машины его части
    if (req.user.role === 'station_dispatcher' && req.user.fireStationId) {
      return this.fireEngineService.getAllByStation(req.user.fireStationId);
    }
    return this.fireEngineService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.fireEngineService.getById(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'station_dispatcher')
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateFireEngineDto, @Req() req: RequestWithUser) {
    if (req.user.role === 'station_dispatcher') {
      // Проверяем, принадлежит ли машина части этого диспетчера
      const engine = await this.fireEngineService.getById(Number(id));
      if (engine && engine.fireStationId !== req.user.fireStationId) {
        throw new BadRequestException('У вас нет прав на редактирование этой техники');
      }
      // Не позволяем диспетчеру менять привязку к части
      dto.fireStationId = req.user.fireStationId;
    }
    return this.fireEngineService.update(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'station_dispatcher')
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: RequestWithUser) {
    if (req.user.role === 'station_dispatcher') {
      // Проверяем, принадлежит ли машина части этого диспетчера
      const engine = await this.fireEngineService.getById(Number(id));
      if (engine && engine.fireStationId !== req.user.fireStationId) {
        throw new BadRequestException('У вас нет прав на удаление этой техники');
      }
    }
    return this.fireEngineService.delete(Number(id));
  }
}
