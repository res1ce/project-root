import { Controller, Post, Body, UseGuards, BadRequestException, Get, Param, Put, Delete } from '@nestjs/common';
import { FireStationService } from './fire-station.service';
import { CreateFireStationDto } from './dto/create-fire-station.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('fire-station')
export class FireStationController {
  constructor(private readonly fireStationService: FireStationService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateFireStationDto) {
    try {
      return await this.fireStationService.createFireStation(dto);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  getAll() {
    return this.fireStationService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.fireStationService.getById(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateFireStationDto) {
    return this.fireStationService.update(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.fireStationService.delete(Number(id));
  }
}
