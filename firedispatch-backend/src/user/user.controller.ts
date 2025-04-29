import { Controller, Get, Req, UseGuards, Body, Post, BadRequestException, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { UserActivityService } from './user-activity.service';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userActivityService: UserActivityService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: RequestWithUser) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin-only')
  adminOnly(@Req() req: RequestWithUser) {
    return { message: 'Only for admin', user: req.user };
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
  @Get('activity')
  async getUserActivities(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string
  ) {
    return this.userActivityService.getUserActivities(
      userId ? Number(userId) : undefined,
      action,
      limit ? Number(limit) : 100
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'central_dispatcher')
  @Get(':id/activity')
  async getUserActivityById(@Param('id') id: string) {
    return this.userActivityService.getUserActivities(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('activity/stats')
  async getActivityStats() {
    // Получаем статистику по типам активности
    // Это можно использовать для создания дашборда администратора
    try {
      const activities = await this.userActivityService.getUserActivities();
      
      // Группируем по типам действий
      const stats = activities.reduce<Record<string, number>>((acc, activity: any) => {
        const action = activity.action;
        acc[action] = (acc[action] || 0) + 1;
        return acc;
      }, {});
      
      // Добавляем дополнительные метрики
      const totalUsers = await this.userService.countUsers();
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const activityToday = activities.filter((a: any) => 
        new Date(a.timestamp) >= startOfToday
      ).length;
      
      return {
        stats,
        totalUsers,
        activityToday,
        totalActivity: activities.length
      };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
