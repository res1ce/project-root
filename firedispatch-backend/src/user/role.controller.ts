import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('role')
export class RoleController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllRoles() {
    // Получаем все возможные роли из перечисления UserRole
    const enumValues = Object.values(UserRole);
    
    // Преобразуем в формат, ожидаемый фронтендом
    return enumValues.map((role, index) => ({
      id: index + 1, // Используем индекс как ID
      name: role,
      description: this.getRoleDescription(role)
    }));
  }
  
  // Вспомогательный метод для получения описания роли
  private getRoleDescription(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Администратор системы';
      case UserRole.CENTRAL_DISPATCHER:
        return 'Центральный диспетчер';
      case UserRole.STATION_DISPATCHER:
        return 'Диспетчер пожарной части';
      default:
        return 'Неизвестная роль';
    }
  }
} 