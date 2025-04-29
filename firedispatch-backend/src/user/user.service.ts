import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    if (!username) throw new Error('username required');
    return this.prisma.user.findFirst({
      where: { username },
      include: { fireStation: true, reports: true },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { fireStation: true },
    });
  }

  async createUser(dto: CreateUserDto) {
    const exists = await this.prisma.user.findFirst({
      where: { username: dto.username },
    });
    if (exists) throw new Error('Username already exists');
    const hash = await bcrypt.hash(dto.password, 10);
    
    return this.prisma.user.create({
      data: {
        username: dto.username,
        password: hash,
        role: dto.role,
        fireStationId: dto.fireStationId,
        name: dto.name || dto.username,
      }
    });
  }

  async countUsers() {
    return this.prisma.user.count();
  }
}
