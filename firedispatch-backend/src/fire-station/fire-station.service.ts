import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFireStationDto } from './dto/create-fire-station.dto';

@Injectable()
export class FireStationService {
  constructor(private prisma: PrismaService) {}

  async createFireStation(dto: CreateFireStationDto) {
    return this.prisma.fireStation.create({
      data: {
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async getAll() {
    return this.prisma.fireStation.findMany();
  }

  async getById(id: number) {
    return this.prisma.fireStation.findUnique({ where: { id } });
  }

  async update(id: number, dto: CreateFireStationDto) {
    return this.prisma.fireStation.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.fireStation.delete({ where: { id } });
  }
}
