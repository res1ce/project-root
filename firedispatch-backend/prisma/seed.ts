import { PrismaClient, UserRole, VehicleType, VehicleStatus, IncidentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаем заполнение базы данными для города Чита...');
  
  try {
    // Очистка данных
    console.log('Очищаем существующие данные...');
    try {
      // Удаляем записи в порядке, учитывающем зависимости
      await prisma.fireHistory.deleteMany({});
      await prisma.userActivity.deleteMany({});
      await prisma.report.deleteMany({});
      await prisma.$executeRaw`DELETE FROM "_FireIncidentToVehicle"`;
      await prisma.fireIncident.deleteMany({});
      await prisma.fireAddressLevel.deleteMany({});
      await prisma.fireLevelRequirement.deleteMany({});
      await prisma.vehicle.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.fireStation.deleteMany({});
      await prisma.fireLevel.deleteMany({});
      await prisma.systemSettings.deleteMany({});
    } catch (error) {
      console.error('Ошибка при очистке данных:', error);
      console.log('Продолжаем заполнение...');
    }
    
    // 1. Заполняем настройки системы
    console.log('Заполняем настройки системы...');
    await prisma.systemSettings.create({
      data: {
        defaultCityName: 'Чита',
        defaultLatitude: 52.0515,
        defaultLongitude: 113.4712,
        defaultZoom: 12
      }
    });
    
    // 2. Создаем пожарные части
    console.log('Заполняем данные о пожарных частях...');
    const fireStations = await Promise.all([
      prisma.fireStation.create({ 
        data: { 
          name: '1-я пожарно-спасательная часть', 
          address: 'г. Чита, ул. Ленина, 65', 
          latitude: 52.0523, 
          longitude: 113.4736
        } 
      }),
      prisma.fireStation.create({ 
        data: { 
          name: '2-я пожарно-спасательная часть', 
          address: 'г. Чита, ул. Журавлева, 79', 
          latitude: 52.0493, 
          longitude: 113.4921
        } 
      }),
      prisma.fireStation.create({ 
        data: { 
          name: '3-я пожарно-спасательная часть', 
          address: 'г. Чита, ул. Ярославского, 1', 
          latitude: 52.0620, 
          longitude: 113.4410
        } 
      }),
      prisma.fireStation.create({ 
        data: { 
          name: '4-я пожарно-спасательная часть', 
          address: 'г. Чита, ул. Кайдаловская, 8', 
          latitude: 52.0290, 
          longitude: 113.5028
        } 
      }),
      prisma.fireStation.create({ 
        data: { 
          name: '5-я пожарно-спасательная часть', 
          address: 'г. Чита, ул. Бабушкина, 112', 
          latitude: 52.0698, 
          longitude: 113.5162
        } 
      }),
      prisma.fireStation.create({ 
        data: { 
          name: '6-я пожарно-спасательная часть', 
          address: 'г. Чита, ул. Красной Звезды, 21', 
          latitude: 52.0414, 
          longitude: 113.4534
        } 
      }),
      prisma.fireStation.create({ 
        data: { 
          name: '7-я пожарно-спасательная часть', 
          address: 'г. Чита, ул. Новобульварная, 163', 
          latitude: 52.0580, 
          longitude: 113.5382
        } 
      }),
      prisma.fireStation.create({ 
        data: { 
          name: '8-я пожарно-спасательная часть', 
          address: 'г. Чита, ул. Ковыльная, 20', 
          latitude: 52.0805, 
          longitude: 113.4221
        } 
      })
    ]);
    console.log(`Создано ${fireStations.length} пожарных частей`);

    // 3. Создаем уровни пожара
    console.log('Заполняем данные об уровнях пожара...');
    const fireLevels = await Promise.all([
      prisma.fireLevel.create({
        data: {
          level: 1,
          name: 'Разведка',
          description: 'Поступил сигнал о возможном возгорании. Требуется разведка.'
        }
      }),
      prisma.fireLevel.create({
        data: {
          level: 2,
          name: 'Локальный',
          description: 'Небольшое возгорание, затрагивающее ограниченную площадь.'
        }
      }),
      prisma.fireLevel.create({
        data: {
          level: 3,
          name: 'Средний',
          description: 'Пожар средней интенсивности, затрагивающий часть здания.'
        }
      }),
      prisma.fireLevel.create({
        data: {
          level: 4,
          name: 'Крупный',
          description: 'Крупный пожар, затрагивающий все здание или комплекс.'
        }
      }),
      prisma.fireLevel.create({
        data: {
          level: 5,
          name: 'Критический',
          description: 'Масштабный пожар с угрозой распространения на соседние объекты.'
        }
      })
    ]);
    console.log(`Создано ${fireLevels.length} уровней пожара`);
    
    // 4. Создаем требования к технике по уровням пожара
    console.log('Заполняем требования к технике по уровням пожара...');
    await Promise.all([
      // Уровень 1 (Разведка)
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
          vehicleType: VehicleType.COMMAND_VEHICLE,
          count: 1
        }
      }),
      
      // Уровень 2 (Локальный)
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
          vehicleType: VehicleType.COMMAND_VEHICLE,
          count: 1
        }
      }),
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[1].id,
          vehicleType: VehicleType.RESCUE_VEHICLE,
          count: 1
        }
      }),
      
      // Уровень 3 (Средний)
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
          vehicleType: VehicleType.LADDER_TRUCK,
          count: 1
        }
      }),
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[2].id,
          vehicleType: VehicleType.COMMAND_VEHICLE,
          count: 1
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
          vehicleType: VehicleType.WATER_TANKER,
          count: 1
        }
      }),
      
      // Уровень 4 (Крупный)
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[3].id,
          vehicleType: VehicleType.FIRE_TRUCK,
          count: 5
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
          vehicleType: VehicleType.COMMAND_VEHICLE,
          count: 2
        }
      }),
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[3].id,
          vehicleType: VehicleType.RESCUE_VEHICLE,
          count: 3
        }
      }),
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[3].id,
          vehicleType: VehicleType.WATER_TANKER,
          count: 2
        }
      }),
      
      // Уровень 5 (Критический)
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[4].id,
          vehicleType: VehicleType.FIRE_TRUCK,
          count: 8
        }
      }),
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[4].id,
          vehicleType: VehicleType.LADDER_TRUCK,
          count: 3
        }
      }),
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[4].id,
          vehicleType: VehicleType.COMMAND_VEHICLE,
          count: 3
        }
      }),
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[4].id,
          vehicleType: VehicleType.RESCUE_VEHICLE,
          count: 4
        }
      }),
      prisma.fireLevelRequirement.create({
        data: {
          fireLevelId: fireLevels[4].id,
          vehicleType: VehicleType.WATER_TANKER,
          count: 4
        }
      })
    ]);
    console.log('Требования к технике созданы');
    
    // 5. Создаем технику для пожарных частей
    console.log('Заполняем данные о технике...');
    const vehicles = [];
    
    // Техника для каждой пожарной части
    for (let i = 0; i < fireStations.length; i++) {
      const stationId = fireStations[i].id;
      
      // Базовый набор техники для каждой части
      vehicles.push(
        await prisma.vehicle.create({
          data: {
            model: 'АЦ-3,0-40 (ЗИЛ 433362)',
            type: VehicleType.FIRE_TRUCK,
            status: VehicleStatus.AVAILABLE,
            fireStationId: stationId
          }
        }),
        await prisma.vehicle.create({
          data: {
            model: 'АЦ-5,0-40 (КАМАЗ 43118)',
            type: VehicleType.FIRE_TRUCK,
            status: VehicleStatus.AVAILABLE,
            fireStationId: stationId
          }
        }),
        await prisma.vehicle.create({
          data: {
            model: 'АЛ-30 (КАМАЗ 53213)',
            type: VehicleType.LADDER_TRUCK,
            status: i === 2 || i === 6 ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE,
            fireStationId: stationId
          }
        }),
        await prisma.vehicle.create({
          data: {
            model: 'АСА-20 (КАМАЗ 43114)',
            type: VehicleType.RESCUE_VEHICLE,
            status: i === 6 ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE,
            fireStationId: stationId
          }
        }),
        await prisma.vehicle.create({
          data: {
            model: 'АР-2 (КАМАЗ 43114)',
            type: VehicleType.WATER_TANKER,
            status: i === 1 ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE,
            fireStationId: stationId
          }
        }),
        await prisma.vehicle.create({
          data: {
            model: 'УАЗ-3909',
            type: VehicleType.COMMAND_VEHICLE,
            status: VehicleStatus.AVAILABLE,
            fireStationId: stationId
          }
        })
      );
      
      // Дополнительная техника для 1-й и 4-й пожарных частей
      if (i === 0) {
        vehicles.push(
          await prisma.vehicle.create({
            data: {
              model: 'АЦ-40 (КАМАЗ 43253)',
              type: VehicleType.FIRE_TRUCK,
              status: VehicleStatus.AVAILABLE,
              fireStationId: stationId
            }
          })
        );
      }
      
      if (i === 3) {
        vehicles.push(
          await prisma.vehicle.create({
            data: {
              model: 'АЦ-40 (КАМАЗ 43253)',
              type: VehicleType.FIRE_TRUCK,
              status: VehicleStatus.AVAILABLE,
              fireStationId: stationId
            }
          })
        );
      }
      
      if (i === 5) {
        vehicles.push(
          await prisma.vehicle.create({
            data: {
              model: 'АЦ-40 (УРАЛ 43206)',
              type: VehicleType.FIRE_TRUCK,
              status: VehicleStatus.AVAILABLE,
              fireStationId: stationId
            }
          })
        );
      }
    }
    console.log(`Создано ${vehicles.length} единиц техники`);
    
    // 6. Создаем данные о пожароопасных адресах
    console.log('Заполняем данные о пожароопасных адресах...');
    await Promise.all([
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. Бабушкина, 98',
          description: 'ТЦ "Маяк", большая площадь, высокая проходимость',
          fireLevelId: fireLevels[3].id
        }
      }),
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. Ленина, 52',
          description: 'Административное здание',
          fireLevelId: fireLevels[2].id
        }
      }),
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. Чкалова, 135',
          description: 'Деревянный жилой дом старой постройки',
          fireLevelId: fireLevels[2].id
        }
      }),
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. Анохина, 120',
          description: 'Нефтебаза',
          fireLevelId: fireLevels[4].id
        }
      }),
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. 9 Января, 37',
          description: 'Хлебозавод',
          fireLevelId: fireLevels[3].id
        }
      }),
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. Шилова, 100',
          description: 'ТРЦ "Макси", многолюдное крупное здание',
          fireLevelId: fireLevels[3].id
        }
      }),
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. Красной Звезды, 51',
          description: 'Склад горюче-смазочных материалов',
          fireLevelId: fireLevels[4].id
        }
      }),
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. Богомягкова, 23',
          description: 'Гостиница "Забайкалье"',
          fireLevelId: fireLevels[2].id
        }
      }),
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. Петровская, 1',
          description: 'Краевая клиническая больница',
          fireLevelId: fireLevels[3].id
        }
      }),
      prisma.fireAddressLevel.create({
        data: {
          address: 'г. Чита, ул. Нагорная, 26',
          description: 'Школа №49',
          fireLevelId: fireLevels[3].id
        }
      })
    ]);
    console.log('Данные о пожароопасных адресах созданы');
    
    // 7. Создаем пользователей
    console.log('Заполняем данные о пользователях...');
    
    // Хешируем пароли
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const centralPasswordHash = await bcrypt.hash('central123', 10);
    const stationPasswordHash = await bcrypt.hash('station123', 10);
    
    // Создаем администраторов
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPasswordHash,
        name: 'Главный администратор',
        role: UserRole.ADMIN
      }
    });
    
    // Создаем центральных диспетчеров
    const centralDispatchers = await Promise.all([
      prisma.user.create({
        data: {
          username: 'central1',
          password: centralPasswordHash,
          name: 'Иванов Иван Иванович',
          role: UserRole.CENTRAL_DISPATCHER
        }
      }),
      prisma.user.create({
        data: {
          username: 'central2',
          password: centralPasswordHash,
          name: 'Петров Петр Петрович',
          role: UserRole.CENTRAL_DISPATCHER
        }
      })
    ]);
    
    // Создаем диспетчеров пожарных частей
    const stationDispatchers = [];
    for (let i = 0; i < fireStations.length; i++) {
      stationDispatchers.push(
        await prisma.user.create({
          data: {
            username: `station${i + 1}`,
            password: stationPasswordHash,
            name: `Диспетчер ${i + 1}-й пожарной части`,
            role: UserRole.STATION_DISPATCHER,
            fireStationId: fireStations[i].id
          }
        })
      );
    }
    
    console.log(`Создано пользователей: ${1 + centralDispatchers.length + stationDispatchers.length}`);
    
    // 8. Создаем данные о пожарах
    console.log('Заполняем данные о пожарах...');
    
    // Исторические пожары (завершенные)
    const historicalFires = await Promise.all([
      prisma.fireIncident.create({
        data: {
          latitude: 52.0513,
          longitude: 113.4738,
          status: IncidentStatus.RESOLVED,
          description: 'Небольшой пожар в квартире',
          address: 'г. Чита, ул. Ленина, 51',
          reportedById: centralDispatchers[0].id,
          assignedToId: stationDispatchers[0].id,
          fireStationId: fireStations[0].id,
          fireLevelId: fireLevels[1].id,
          resolvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 дней назад
        }
      }),
      prisma.fireIncident.create({
        data: {
          latitude: 52.0595,
          longitude: 113.4911,
          status: IncidentStatus.RESOLVED,
          description: 'Возгорание в офисном здании',
          address: 'г. Чита, ул. Журавлева, 104',
          reportedById: centralDispatchers[1].id,
          assignedToId: stationDispatchers[1].id,
          fireStationId: fireStations[1].id,
          fireLevelId: fireLevels[2].id,
          resolvedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 дней назад
        }
      }),
      prisma.fireIncident.create({
        data: {
          latitude: 52.0651,
          longitude: 113.4512,
          status: IncidentStatus.RESOLVED,
          description: 'Пожар в частном доме',
          address: 'г. Чита, ул. Ярославского, 15',
          reportedById: centralDispatchers[0].id,
          assignedToId: stationDispatchers[2].id,
          fireStationId: fireStations[2].id,
          fireLevelId: fireLevels[2].id,
          resolvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 дней назад
        }
      })
    ]);
    
    // Текущие пожары
    const activeFires = await Promise.all([
      prisma.fireIncident.create({
        data: {
          latitude: 52.0424,
          longitude: 113.5113,
          status: IncidentStatus.IN_PROGRESS,
          description: 'Пожар на промышленном объекте',
          address: 'г. Чита, ул. Кайдаловская, 24',
          reportedById: centralDispatchers[1].id,
          assignedToId: stationDispatchers[3].id,
          fireStationId: fireStations[3].id,
          fireLevelId: fireLevels[3].id
        }
      }),
      prisma.fireIncident.create({
        data: {
          latitude: 52.0717,
          longitude: 113.5223,
          status: IncidentStatus.PENDING,
          description: 'Сообщение о задымлении',
          address: 'г. Чита, ул. Бабушкина, 147',
          reportedById: centralDispatchers[0].id,
          assignedToId: stationDispatchers[4].id,
          fireStationId: fireStations[4].id,
          fireLevelId: fireLevels[0].id
        }
      })
    ]);
    
    // Назначаем технику для активных пожаров
    await prisma.fireIncident.update({
      where: { id: activeFires[0].id },
      data: {
        vehicles: {
          connect: [
            { id: vehicles[24].id }, // Пожарная машина 5-й части
            { id: vehicles[25].id }, // Еще одна пожарная машина 5-й части
            { id: vehicles[26].id }, // Автолестница 5-й части
            { id: vehicles[27].id }, // Спасательный автомобиль 5-й части
            { id: vehicles[29].id }  // Командный автомобиль 5-й части
          ]
        }
      }
    });
    
    console.log(`Создано пожаров: ${historicalFires.length + activeFires.length}`);
    
    // 9. Создаем записи в истории пожаров
    console.log('Заполняем историю пожаров...');
    await Promise.all([
      prisma.fireHistory.create({
        data: {
          fireIncidentId: activeFires[0].id,
          action: 'Создание',
          details: 'Пожар зарегистрирован в системе',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 часа назад
        }
      }),
      prisma.fireHistory.create({
        data: {
          fireIncidentId: activeFires[0].id,
          action: 'Изменение статуса',
          details: 'Статус изменен на "В процессе"',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 час назад
        }
      }),
      prisma.fireHistory.create({
        data: {
          fireIncidentId: activeFires[0].id,
          action: 'Назначение техники',
          details: 'Назначено 5 единиц техники',
          timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000) // 30 минут назад
        }
      }),
      prisma.fireHistory.create({
        data: {
          fireIncidentId: activeFires[1].id,
          action: 'Создание',
          details: 'Пожар зарегистрирован в системе',
          timestamp: new Date(Date.now() - 0.25 * 60 * 60 * 1000) // 15 минут назад
        }
      })
    ]);
    
    console.log('Заполнение базы данных успешно завершено!');
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('База данных успешно заполнена тестовыми данными для города Чита');
  })
  .catch((e) => {
    console.error('Ошибка при заполнении базы данных:', e);
    process.exit(1);
  }); 