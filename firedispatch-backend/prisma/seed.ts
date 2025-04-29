import { PrismaClient, UserRole, VehicleType, VehicleStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding process...');

  // Очищаем старые данные
  await prisma.userActivity.deleteMany();
  await prisma.report.deleteMany();
  await prisma.fireLevelRequirement.deleteMany();
  await prisma.fireIncident.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.fireLevel.deleteMany();
  await prisma.fireStation.deleteMany();

  console.log('Cleared old data');

  // Создаем пожарные уровни
  const fireLevels = await Promise.all([
    prisma.fireLevel.create({
      data: {
        level: 1,
        name: 'Уровень 1',
        description: 'Небольшой пожар, локального характера'
      }
    }),
    prisma.fireLevel.create({
      data: {
        level: 2,
        name: 'Уровень 2',
        description: 'Средний пожар, требует несколько единиц техники'
      }
    }),
    prisma.fireLevel.create({
      data: {
        level: 3,
        name: 'Уровень 3',
        description: 'Крупный пожар, требует значительное количество техники'
      }
    }),
    prisma.fireLevel.create({
      data: {
        level: 4,
        name: 'Уровень 4',
        description: 'Очень крупный пожар, высокий риск распространения'
      }
    }),
    prisma.fireLevel.create({
      data: {
        level: 5,
        name: 'Уровень 5',
        description: 'Критический пожар, максимальная мобилизация ресурсов'
      }
    }),
  ]);

  console.log('Created fire levels');

  // Создаем требования к машинам для каждого уровня
  await Promise.all([
    // Уровень 1
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[0].id,
        vehicleType: VehicleType.FIRE_TRUCK,
        count: 1
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[0].id,
        vehicleType: VehicleType.RESCUE_VEHICLE,
        count: 1
      }
    }),

    // Уровень 2
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[1].id,
        vehicleType: VehicleType.FIRE_TRUCK,
        count: 2
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[1].id,
        vehicleType: VehicleType.RESCUE_VEHICLE,
        count: 1
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[1].id,
        vehicleType: VehicleType.LADDER_TRUCK,
        count: 1
      }
    }),

    // Уровень 3
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[2].id,
        vehicleType: VehicleType.FIRE_TRUCK,
        count: 3
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[2].id,
        vehicleType: VehicleType.RESCUE_VEHICLE,
        count: 2
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[2].id,
        vehicleType: VehicleType.LADDER_TRUCK,
        count: 1
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[2].id,
        vehicleType: VehicleType.WATER_TANKER,
        count: 1
      }
    }),

    // Уровень 4
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[3].id,
        vehicleType: VehicleType.FIRE_TRUCK,
        count: 4
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[3].id,
        vehicleType: VehicleType.RESCUE_VEHICLE,
        count: 2
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[3].id,
        vehicleType: VehicleType.LADDER_TRUCK,
        count: 2
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[3].id,
        vehicleType: VehicleType.WATER_TANKER,
        count: 2
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[3].id,
        vehicleType: VehicleType.COMMAND_VEHICLE,
        count: 1
      }
    }),

    // Уровень 5
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[4].id,
        vehicleType: VehicleType.FIRE_TRUCK,
        count: 6
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[4].id,
        vehicleType: VehicleType.RESCUE_VEHICLE,
        count: 3
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[4].id,
        vehicleType: VehicleType.LADDER_TRUCK,
        count: 2
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[4].id,
        vehicleType: VehicleType.WATER_TANKER,
        count: 3
      }
    }),
    prisma.fireLevelRequirement.create({
      data: {
        fireLevelId: fireLevels[4].id,
        vehicleType: VehicleType.COMMAND_VEHICLE,
        count: 2
      }
    }),
  ]);

  console.log('Created fire level requirements');

  // Создаем пожарные части
  const fireStations = await Promise.all([
    prisma.fireStation.create({
      data: {
        name: 'Пожарная часть №1',
        address: 'ул. Пожарная, 1',
        latitude: 55.751244,
        longitude: 37.618423
      }
    }),
    prisma.fireStation.create({
      data: {
        name: 'Пожарная часть №2',
        address: 'ул. Огненная, 5',
        latitude: 55.76245,
        longitude: 37.63245
      }
    }),
    prisma.fireStation.create({
      data: {
        name: 'Пожарная часть №3',
        address: 'ул. Спасателей, 10',
        latitude: 55.73245,
        longitude: 37.65245
      }
    })
  ]);

  console.log('Created fire stations');

  // Создаем пользователей
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    // Администратор
    prisma.user.create({
      data: {
        username: 'admin',
        password: passwordHash,
        name: 'Администратор Системы',
        role: UserRole.ADMIN
      }
    }),
    // Центральный диспетчер
    prisma.user.create({
      data: {
        username: 'central',
        password: passwordHash,
        name: 'Центральный Диспетчер',
        role: UserRole.CENTRAL_DISPATCHER
      }
    }),
    // Диспетчеры пожарных частей
    prisma.user.create({
      data: {
        username: 'dispatcher1',
        password: passwordHash,
        name: 'Диспетчер Части №1',
        role: UserRole.STATION_DISPATCHER,
        fireStationId: fireStations[0].id
      }
    }),
    prisma.user.create({
      data: {
        username: 'dispatcher2',
        password: passwordHash,
        name: 'Диспетчер Части №2',
        role: UserRole.STATION_DISPATCHER,
        fireStationId: fireStations[1].id
      }
    }),
    prisma.user.create({
      data: {
        username: 'dispatcher3',
        password: passwordHash,
        name: 'Диспетчер Части №3',
        role: UserRole.STATION_DISPATCHER,
        fireStationId: fireStations[2].id
      }
    })
  ]);

  console.log('Created users');

  // Создаем пожарные машины
  await Promise.all([
    // Пожарная часть №1
    prisma.vehicle.create({
      data: {
        model: 'АЦ-3.2-40',
        type: VehicleType.FIRE_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[0].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АЦ-5.0-40',
        type: VehicleType.FIRE_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[0].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АЛ-30',
        type: VehicleType.LADDER_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[0].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АСА-20',
        type: VehicleType.RESCUE_VEHICLE,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[0].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АВЦ-1.7',
        type: VehicleType.WATER_TANKER,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[0].id
      }
    }),

    // Пожарная часть №2
    prisma.vehicle.create({
      data: {
        model: 'АЦ-3.2-40',
        type: VehicleType.FIRE_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[1].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АЦ-5.0-40',
        type: VehicleType.FIRE_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[1].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АЦ-7.0-40',
        type: VehicleType.FIRE_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[1].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АЛ-50',
        type: VehicleType.LADDER_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[1].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АСА-20',
        type: VehicleType.RESCUE_VEHICLE,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[1].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АШ',
        type: VehicleType.COMMAND_VEHICLE,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[1].id
      }
    }),

    // Пожарная часть №3
    prisma.vehicle.create({
      data: {
        model: 'АЦ-3.2-40',
        type: VehicleType.FIRE_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АЦ-5.0-40',
        type: VehicleType.FIRE_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АЦ-7.0-40',
        type: VehicleType.FIRE_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АЦ-8.0-40',
        type: VehicleType.FIRE_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АЛ-30',
        type: VehicleType.LADDER_TRUCK,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АСА-20',
        type: VehicleType.RESCUE_VEHICLE,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АСА-30',
        type: VehicleType.RESCUE_VEHICLE,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АВЦ-1.7',
        type: VehicleType.WATER_TANKER,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АВЦ-3.0',
        type: VehicleType.WATER_TANKER,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    }),
    prisma.vehicle.create({
      data: {
        model: 'АШ',
        type: VehicleType.COMMAND_VEHICLE,
        status: VehicleStatus.AVAILABLE,
        fireStationId: fireStations[2].id
      }
    })
  ]);

  console.log('Created vehicles');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
  console.error(e);
  process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 