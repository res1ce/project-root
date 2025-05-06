import { Controller, Post, Body, UseGuards, BadRequestException, Get, Param, Put, Delete, Req, NotFoundException, Patch } from '@nestjs/common';
import { FireService } from './fire.service';
import { CreateFireDto } from './dto/create-fire.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ChangeFireLevelDto } from './dto/change-fire-level.dto';
import { UserActivityService } from '../user/user-activity.service';
import { Request } from 'express';
import { CreateFireLevelDto } from './dto/create-firelevel.dto';
import { CreateFireLevelRequirementDto } from './dto/create-firelevel-requirement.dto';
import { CreateAddressLevelDto } from './dto/create-address-level.dto';
import { IncidentStatus } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('fire')
export class FireController {
  constructor(
    private readonly fireService: FireService,
    private readonly userActivityService: UserActivityService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getAll(@Req() req: RequestWithUser) {
    // Передаем ID пользователя и его роль в сервис для фильтрации пожаров
    return this.fireService.getAll(req.user.userId, req.user.role);
  }

  // --- CRUD FireLevelEngineRequirement ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('/requirement')
  getAllRequirements() {
    return this.fireService.getAllRequirements();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('/requirement/:id')
  async getRequirementById(@Param('id') id: string) {
    const numId = Number(id);
    if (isNaN(numId)) throw new BadRequestException('Некорректный id');
    const req = await this.fireService.getRequirementById(numId);
    if (!req) throw new NotFoundException(`Требование с id ${id} не найдено`);
    return req;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('/requirement')
  createRequirement(@Body() dto: CreateFireLevelRequirementDto) {
    return this.fireService.createRequirement(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('/requirement/:id')
  updateRequirement(@Param('id') id: string, @Body() dto: CreateFireLevelRequirementDto) {
    const numId = Number(id);
    if (isNaN(numId)) throw new BadRequestException('Некорректный id');
    return this.fireService.updateRequirement(numId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('/requirement/:id')
  deleteRequirement(@Param('id') id: string) {
    const numId = Number(id);
    if (isNaN(numId)) throw new BadRequestException('Некорректный id');
    return this.fireService.deleteRequirement(numId);
  }

  // --- CRUD для уровней пожара ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('/level')
  getAllLevels() {
    return this.fireService.getAllLevels();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('/level/:id')
  async getLevelById(@Param('id') id: string) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) throw new BadRequestException('Некорректный id');
    const level = await this.fireService.getLevelById(numId);
    if (!level) throw new NotFoundException(`Уровень с id ${id} не найден`);
    return level;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('/level')
  createLevel(@Body() dto: CreateFireLevelDto) {
    return this.fireService.createLevel(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('/level/:id')
  updateLevel(@Param('id') id: string, @Body() dto: CreateFireLevelDto) {
    return this.fireService.updateLevel(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('/level/:id')
  deleteLevel(@Param('id') id: string) {
    return this.fireService.deleteLevel(Number(id));
  }

  // --- Управление адресами с предопределенными уровнями пожаров ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('/address-level')
  getAllAddressLevels() {
    return this.fireService.getAllAddressLevels();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('/address-level/:id')
  async getAddressLevelById(@Param('id') id: string) {
    const numId = Number(id);
    if (isNaN(numId)) throw new BadRequestException('Некорректный id');
    return this.fireService.getAddressLevelById(numId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('/address-level')
  createAddressLevel(@Body() dto: CreateAddressLevelDto) {
    return this.fireService.createAddressLevel(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('/address-level/:id')
  updateAddressLevel(@Param('id') id: string, @Body() dto: CreateAddressLevelDto) {
    return this.fireService.updateAddressLevel(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('/address-level/:id')
  deleteAddressLevel(@Param('id') id: string) {
    return this.fireService.deleteAddressLevel(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('central_dispatcher')
  @Post()
  async create(@Body() dto: CreateFireDto, @Req() req: RequestWithUser) {
    // Получаем текущего пользователя из запроса
    const userId = req.user.userId;
    
    // Устанавливаем reportedById из текущего пользователя
    dto.reportedById = userId;
    
    // Если указан флаг autoLevel, автоматически определяем уровень пожара
    if (dto.autoLevel) {
      // Используем адрес и координаты для определения уровня пожара
      const determinedLevel = await this.fireService.determineFireLevel(dto.location, dto.address);
      
      // Получаем ID уровня пожара на основе его номера
      const fireLevel = await this.fireService.getLevelByNumber(determinedLevel);
      if (fireLevel) {
        dto.levelId = fireLevel.id;
      } else {
        // Если уровень не найден, используем первый доступный
        const firstLevel = await this.fireService.getFirstLevel();
        if (firstLevel) {
          dto.levelId = firstLevel.id;
        } else {
          throw new BadRequestException('В системе не настроены уровни пожаров');
        }
      }
    }
    
    // Проверяем, что уровень пожара указан
    if (!dto.levelId) {
      throw new BadRequestException('Необходимо указать уровень пожара или включить автоматическое определение');
    }
    
    const result = await this.fireService.create(dto);
    
    // Логируем создание пожара
    await this.userActivityService.logActivity(
      userId,
      'create_fire',
      {
        fireId: result.id,
        location: dto.location,
        levelId: dto.levelId,
        autoLevel: dto.autoLevel || false
      },
      req
    );
    
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id') id: string) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) throw new BadRequestException('Некорректный id');
    const fire = await this.fireService.getById(numId);
    if (!fire) throw new NotFoundException(`Пожар с id ${id} не найден`);
    return fire;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('central_dispatcher', 'station_dispatcher')
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateFireDto, @Req() req: RequestWithUser) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) throw new BadRequestException('Некорректный id');
    const result = await this.fireService.update(numId, dto);
    if (!result) throw new NotFoundException(`Пожар с id ${id} не найден`);
    await this.userActivityService.logActivity(
      req.user.userId, 
      'update_fire', 
      { fireId: numId, updates: dto },
      req
    );
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('central_dispatcher', 'station_dispatcher')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.fireService.delete(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/assignments')
  async getAssignments(@Param('id') id: string) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) throw new BadRequestException('Некорректный id');
    const assignments = await this.fireService.getAssignmentsByFireId(numId);
    if (!assignments || assignments.length === 0) throw new NotFoundException(`Назначения для пожара с id ${id} не найдены`);
    return assignments;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async getFireHistory(@Param('id') id: string) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) throw new BadRequestException('Некорректный id');
    const history = await this.fireService.getFireHistory(numId);
    if (!history || history.length === 0) throw new NotFoundException(`История для пожара с id ${id} не найдена`);
    return history;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('station_dispatcher')
  @Put(':id/level')
  async changeFireLevel(
    @Param('id') id: string, 
    @Body() dto: ChangeFireLevelDto,
    @Req() req: RequestWithUser
  ) {
    const result = await this.fireService.changeFireLevel(Number(id), dto);
    
    // Логируем действие
    await this.userActivityService.logActivity(
      req.user.userId, 
      'change_fire_level', 
      { fireId: Number(id), newLevelId: dto.newLevel, reason: dto.reason },
      req
    );
    
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('central_dispatcher', 'station_dispatcher')
  @Patch(':id/resolve')
  async resolveFire(@Param('id') id: string, @Req() req: RequestWithUser) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) throw new BadRequestException('Некорректный id');
    
    const result = await this.fireService.setFireStatus(numId, 'RESOLVED' as IncidentStatus);
    
    // Логируем действие
    await this.userActivityService.logActivity(
      req.user.userId,
      'resolve_fire',
      { fireId: numId },
      req
    );
    
    return result;
  }
}
