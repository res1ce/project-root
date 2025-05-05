import { Controller, Get, UseGuards, Body, Post, BadRequestException, Req, Param, Put, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { UserActivityService } from './user-activity.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('user')
export class UserApiController {
  constructor(
    private readonly userService: UserService,
    private readonly userActivityService: UserActivityService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async createUser(@Body() dto: CreateUserDto, @Req() req: RequestWithUser) {
    try {
      const result = await this.userService.createUser(dto);
      
      // Логируем действие
      await this.userActivityService.logActivity(
        req.user.userId,
        'create_user',
        { username: dto.username, role: dto.role, fireStationId: dto.fireStationId },
        req
      );
      
      return result;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() dto: any, @Req() req: RequestWithUser) {
    try {
      const result = await this.userService.updateUser(Number(id), dto);
      
      // Логируем действие
      await this.userActivityService.logActivity(
        req.user.userId,
        'update_user',
        { userId: Number(id), updates: dto },
        req
      );
      
      return result;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      const result = await this.userService.deleteUser(Number(id));
      
      // Логируем действие
      await this.userActivityService.logActivity(
        req.user.userId,
        'delete_user',
        { userId: Number(id) },
        req
      );
      
      return result;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
} 