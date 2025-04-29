import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFireEngineDto } from './dto/create-fire-engine.dto';

@Injectable()
export class FireEngineService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFireEngineDto) {
    return this.prisma.vehicle.create({
      data: {
        model: dto.model,
        type: dto.type,
        fireStation: {
          connect: { id: dto.fireStationId }
        }
      }
    });
  }

  async getAll() {
    return this.prisma.vehicle.findMany({
      include: { 
        fireStation: true 
      }
    });
  }

  async getAllByStation(stationId: number) {
    return this.prisma.vehicle.findMany({
      where: {
        fireStationId: stationId
      },
      include: { 
        fireStation: true 
      }
    });
  }

  async getById(id: number) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: { 
        fireStation: true 
      }
    });
  }

  async update(id: number, dto: CreateFireEngineDto) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        model: dto.model,
        type: dto.type,
        status: dto.status,
        fireStation: dto.fireStationId ? {
          connect: { id: dto.fireStationId }
        } : undefined
      }
    });
  }

  async delete(id: number) {
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
