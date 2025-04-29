import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

@Injectable()
export class SystemSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    // Получаем текущие настройки или создаем стандартные для Читы, если их нет
    const settings = await this.prisma.systemSettings.findFirst();
    
    if (!settings) {
      return this.prisma.systemSettings.create({
        data: {
          defaultCityName: 'Чита',
          defaultLatitude: 52.0515,
          defaultLongitude: 113.4712,
          defaultZoom: 12
        }
      });
    }
    
    return settings;
  }

  async updateSettings(dto: UpdateSystemSettingsDto, userId: number) {
    // Получаем существующие настройки
    const existingSettings = await this.getSettings();
    
    if (!existingSettings) {
      throw new NotFoundException('Настройки не найдены');
    }
    
    // Обновляем настройки
    return this.prisma.systemSettings.update({
      where: { id: existingSettings.id },
      data: {
        defaultCityName: dto.defaultCityName !== undefined ? dto.defaultCityName : undefined,
        defaultLatitude: dto.defaultLatitude !== undefined ? dto.defaultLatitude : undefined,
        defaultLongitude: dto.defaultLongitude !== undefined ? dto.defaultLongitude : undefined,
        defaultZoom: dto.defaultZoom !== undefined ? dto.defaultZoom : undefined,
        updatedById: userId
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    });
  }
} 