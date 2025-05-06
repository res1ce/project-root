// Типы пожарных машин с человекочитаемыми названиями
export const VEHICLE_TYPE_NAMES = {
  'FIRE_TRUCK': 'Пожарная машина',
  'LADDER_TRUCK': 'Пожарная автолестница',
  'RESCUE_VEHICLE': 'Спасательный автомобиль',
  'WATER_TANKER': 'Автоцистерна',
  'COMMAND_VEHICLE': 'Штабной автомобиль'
};

// Функция для получения человекочитаемого названия типа транспорта
export function getVehicleTypeName(type: string): string {
  return VEHICLE_TYPE_NAMES[type as keyof typeof VEHICLE_TYPE_NAMES] || type;
} 