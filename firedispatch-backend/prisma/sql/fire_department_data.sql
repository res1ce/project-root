-- Данные о пожарных частях города Чита
INSERT INTO fire_stations (name, address, latitude, longitude, created_at, updated_at)
VALUES
  ('1-я пожарно-спасательная часть', 'г. Чита, ул. Ленина, 65', 52.0523, 113.4736, NOW(), NOW()),
  ('2-я пожарно-спасательная часть', 'г. Чита, ул. Журавлева, 79', 52.0493, 113.4921, NOW(), NOW()),
  ('3-я пожарно-спасательная часть', 'г. Чита, ул. Ярославского, 1', 52.0620, 113.4410, NOW(), NOW()),
  ('4-я пожарно-спасательная часть', 'г. Чита, ул. Кайдаловская, 8', 52.0290, 113.5028, NOW(), NOW()),
  ('5-я пожарно-спасательная часть', 'г. Чита, ул. Бабушкина, 112', 52.0698, 113.5162, NOW(), NOW()),
  ('6-я пожарно-спасательная часть', 'г. Чита, ул. Красной Звезды, 21', 52.0414, 113.4534, NOW(), NOW()),
  ('7-я пожарно-спасательная часть', 'г. Чита, ул. Новобульварная, 163', 52.0580, 113.5382, NOW(), NOW()),
  ('8-я пожарно-спасательная часть', 'г. Чита, ул. Ковыльная, 20', 52.0805, 113.4221, NOW(), NOW());

-- Уровни пожара
INSERT INTO fire_levels (level, name, description, created_at, updated_at)
VALUES
  (1, 'Разведка', 'Поступил сигнал о возможном возгорании. Требуется разведка.', NOW(), NOW()),
  (2, 'Локальный', 'Небольшое возгорание, затрагивающее ограниченную площадь.', NOW(), NOW()),
  (3, 'Средний', 'Пожар средней интенсивности, затрагивающий часть здания.', NOW(), NOW()),
  (4, 'Крупный', 'Крупный пожар, затрагивающий все здание или комплекс.', NOW(), NOW()),
  (5, 'Критический', 'Масштабный пожар с угрозой распространения на соседние объекты.', NOW(), NOW());

-- Требования к технике по уровням пожара
-- Уровень 1 (Разведка)
INSERT INTO fire_level_requirements (fire_level_id, vehicle_type, count, created_at, updated_at)
VALUES
  (1, 'FIRE_TRUCK', 1, NOW(), NOW()),
  (1, 'COMMAND_VEHICLE', 1, NOW(), NOW());

-- Уровень 2 (Локальный)
INSERT INTO fire_level_requirements (fire_level_id, vehicle_type, count, created_at, updated_at)
VALUES
  (2, 'FIRE_TRUCK', 2, NOW(), NOW()),
  (2, 'COMMAND_VEHICLE', 1, NOW(), NOW()),
  (2, 'RESCUE_VEHICLE', 1, NOW(), NOW());

-- Уровень 3 (Средний)
INSERT INTO fire_level_requirements (fire_level_id, vehicle_type, count, created_at, updated_at)
VALUES
  (3, 'FIRE_TRUCK', 3, NOW(), NOW()),
  (3, 'LADDER_TRUCK', 1, NOW(), NOW()),
  (3, 'COMMAND_VEHICLE', 1, NOW(), NOW()),
  (3, 'RESCUE_VEHICLE', 2, NOW(), NOW()),
  (3, 'WATER_TANKER', 1, NOW(), NOW());

-- Уровень 4 (Крупный)
INSERT INTO fire_level_requirements (fire_level_id, vehicle_type, count, created_at, updated_at)
VALUES
  (4, 'FIRE_TRUCK', 5, NOW(), NOW()),
  (4, 'LADDER_TRUCK', 2, NOW(), NOW()),
  (4, 'COMMAND_VEHICLE', 2, NOW(), NOW()),
  (4, 'RESCUE_VEHICLE', 3, NOW(), NOW()),
  (4, 'WATER_TANKER', 2, NOW(), NOW());

-- Уровень 5 (Критический)
INSERT INTO fire_level_requirements (fire_level_id, vehicle_type, count, created_at, updated_at)
VALUES
  (5, 'FIRE_TRUCK', 8, NOW(), NOW()),
  (5, 'LADDER_TRUCK', 3, NOW(), NOW()),
  (5, 'COMMAND_VEHICLE', 3, NOW(), NOW()),
  (5, 'RESCUE_VEHICLE', 4, NOW(), NOW()),
  (5, 'WATER_TANKER', 4, NOW(), NOW());

-- Транспортные средства пожарных частей
-- 1-я пожарно-спасательная часть
INSERT INTO vehicles (model, type, status, fire_station_id, created_at, updated_at)
VALUES
  ('АЦ-40 (КАМАЗ 43253)', 'FIRE_TRUCK', 'AVAILABLE', 1, NOW(), NOW()),
  ('АЦ-3,0-40 (ЗИЛ 433362)', 'FIRE_TRUCK', 'AVAILABLE', 1, NOW(), NOW()),
  ('АЛ-30 (КАМАЗ 53213)', 'LADDER_TRUCK', 'AVAILABLE', 1, NOW(), NOW()),
  ('АСА-20 (КАМАЗ 43114)', 'RESCUE_VEHICLE', 'AVAILABLE', 1, NOW(), NOW()),
  ('АР-2 (КАМАЗ 43114)', 'WATER_TANKER', 'AVAILABLE', 1, NOW(), NOW()),
  ('УАЗ-3909', 'COMMAND_VEHICLE', 'AVAILABLE', 1, NOW(), NOW());

-- 2-я пожарно-спасательная часть
INSERT INTO vehicles (model, type, status, fire_station_id, created_at, updated_at)
VALUES
  ('АЦ-5,0-40 (КАМАЗ 43118)', 'FIRE_TRUCK', 'AVAILABLE', 2, NOW(), NOW()),
  ('АЦ-3,0-40 (ЗИЛ 433362)', 'FIRE_TRUCK', 'AVAILABLE', 2, NOW(), NOW()),
  ('АЛ-30 (КАМАЗ 53213)', 'LADDER_TRUCK', 'AVAILABLE', 2, NOW(), NOW()),
  ('АСА-20 (КАМАЗ 43114)', 'RESCUE_VEHICLE', 'AVAILABLE', 2, NOW(), NOW()),
  ('АР-2 (КАМАЗ 43114)', 'WATER_TANKER', 'MAINTENANCE', 2, NOW(), NOW()),
  ('УАЗ-3909', 'COMMAND_VEHICLE', 'AVAILABLE', 2, NOW(), NOW());

-- 3-я пожарно-спасательная часть
INSERT INTO vehicles (model, type, status, fire_station_id, created_at, updated_at)
VALUES
  ('АЦ-3,0-40 (ЗИЛ 433362)', 'FIRE_TRUCK', 'AVAILABLE', 3, NOW(), NOW()),
  ('АЦ-5,0-40 (КАМАЗ 43118)', 'FIRE_TRUCK', 'AVAILABLE', 3, NOW(), NOW()),
  ('АЛ-30 (КАМАЗ 53213)', 'LADDER_TRUCK', 'MAINTENANCE', 3, NOW(), NOW()),
  ('АСА-20 (КАМАЗ 43114)', 'RESCUE_VEHICLE', 'AVAILABLE', 3, NOW(), NOW()),
  ('АР-2 (КАМАЗ 43114)', 'WATER_TANKER', 'AVAILABLE', 3, NOW(), NOW()),
  ('УАЗ-3909', 'COMMAND_VEHICLE', 'AVAILABLE', 3, NOW(), NOW());

-- 4-я пожарно-спасательная часть
INSERT INTO vehicles (model, type, status, fire_station_id, created_at, updated_at)
VALUES
  ('АЦ-5,0-40 (КАМАЗ 43118)', 'FIRE_TRUCK', 'AVAILABLE', 4, NOW(), NOW()),
  ('АЦ-3,0-40 (ЗИЛ 433362)', 'FIRE_TRUCK', 'AVAILABLE', 4, NOW(), NOW()),
  ('АЦ-40 (КАМАЗ 43253)', 'FIRE_TRUCK', 'AVAILABLE', 4, NOW(), NOW()),
  ('АЛ-30 (КАМАЗ 53213)', 'LADDER_TRUCK', 'AVAILABLE', 4, NOW(), NOW()),
  ('АСА-20 (КАМАЗ 43114)', 'RESCUE_VEHICLE', 'AVAILABLE', 4, NOW(), NOW()),
  ('АР-2 (КАМАЗ 43114)', 'WATER_TANKER', 'AVAILABLE', 4, NOW(), NOW()),
  ('УАЗ-3909', 'COMMAND_VEHICLE', 'AVAILABLE', 4, NOW(), NOW());

-- 5-я пожарно-спасательная часть
INSERT INTO vehicles (model, type, status, fire_station_id, created_at, updated_at)
VALUES
  ('АЦ-3,0-40 (ЗИЛ 433362)', 'FIRE_TRUCK', 'AVAILABLE', 5, NOW(), NOW()),
  ('АЦ-5,0-40 (КАМАЗ 43118)', 'FIRE_TRUCK', 'AVAILABLE', 5, NOW(), NOW()),
  ('АЛ-30 (КАМАЗ 53213)', 'LADDER_TRUCK', 'AVAILABLE', 5, NOW(), NOW()),
  ('АСА-20 (КАМАЗ 43114)', 'RESCUE_VEHICLE', 'AVAILABLE', 5, NOW(), NOW()),
  ('АР-2 (КАМАЗ 43114)', 'WATER_TANKER', 'AVAILABLE', 5, NOW(), NOW()),
  ('УАЗ-3909', 'COMMAND_VEHICLE', 'AVAILABLE', 5, NOW(), NOW());

-- 6-я пожарно-спасательная часть
INSERT INTO vehicles (model, type, status, fire_station_id, created_at, updated_at)
VALUES
  ('АЦ-40 (УРАЛ 43206)', 'FIRE_TRUCK', 'AVAILABLE', 6, NOW(), NOW()),
  ('АЦ-5,0-40 (КАМАЗ 43118)', 'FIRE_TRUCK', 'AVAILABLE', 6, NOW(), NOW()),
  ('АЛ-30 (КАМАЗ 53213)', 'LADDER_TRUCK', 'AVAILABLE', 6, NOW(), NOW()),
  ('АСА-20 (КАМАЗ 43114)', 'RESCUE_VEHICLE', 'AVAILABLE', 6, NOW(), NOW()),
  ('АР-2 (КАМАЗ 43114)', 'WATER_TANKER', 'AVAILABLE', 6, NOW(), NOW()),
  ('УАЗ-3909', 'COMMAND_VEHICLE', 'AVAILABLE', 6, NOW(), NOW());

-- 7-я пожарно-спасательная часть
INSERT INTO vehicles (model, type, status, fire_station_id, created_at, updated_at)
VALUES
  ('АЦ-3,0-40 (ЗИЛ 433362)', 'FIRE_TRUCK', 'AVAILABLE', 7, NOW(), NOW()),
  ('АЦ-5,0-40 (КАМАЗ 43118)', 'FIRE_TRUCK', 'AVAILABLE', 7, NOW(), NOW()),
  ('АЛ-30 (КАМАЗ 53213)', 'LADDER_TRUCK', 'AVAILABLE', 7, NOW(), NOW()),
  ('АСА-20 (КАМАЗ 43114)', 'RESCUE_VEHICLE', 'MAINTENANCE', 7, NOW(), NOW()),
  ('АР-2 (КАМАЗ 43114)', 'WATER_TANKER', 'AVAILABLE', 7, NOW(), NOW()),
  ('УАЗ-3909', 'COMMAND_VEHICLE', 'AVAILABLE', 7, NOW(), NOW());

-- 8-я пожарно-спасательная часть
INSERT INTO vehicles (model, type, status, fire_station_id, created_at, updated_at)
VALUES
  ('АЦ-3,0-40 (ЗИЛ 433362)', 'FIRE_TRUCK', 'AVAILABLE', 8, NOW(), NOW()),
  ('АЦ-5,0-40 (КАМАЗ 43118)', 'FIRE_TRUCK', 'AVAILABLE', 8, NOW(), NOW()),
  ('АЛ-30 (КАМАЗ 53213)', 'LADDER_TRUCK', 'AVAILABLE', 8, NOW(), NOW()),
  ('АСА-20 (КАМАЗ 43114)', 'RESCUE_VEHICLE', 'AVAILABLE', 8, NOW(), NOW()),
  ('АР-2 (КАМАЗ 43114)', 'WATER_TANKER', 'AVAILABLE', 8, NOW(), NOW()),
  ('УАЗ-3909', 'COMMAND_VEHICLE', 'AVAILABLE', 8, NOW(), NOW());

-- Данные о пожароопасных адресах
INSERT INTO fire_address_levels (address, description, fire_level_id, created_at, updated_at)
VALUES
  ('г. Чита, ул. Бабушкина, 98', 'ТЦ "Маяк", большая площадь, высокая проходимость', 4, NOW(), NOW()),
  ('г. Чита, ул. Ленина, 52', 'Административное здание', 3, NOW(), NOW()),
  ('г. Чита, ул. Чкалова, 135', 'Деревянный жилой дом старой постройки', 3, NOW(), NOW()),
  ('г. Чита, ул. Анохина, 120', 'Нефтебаза', 5, NOW(), NOW()),
  ('г. Чита, ул. 9 Января, 37', 'Хлебозавод', 4, NOW(), NOW()),
  ('г. Чита, ул. Шилова, 100', 'ТРЦ "Макси", многолюдное крупное здание', 4, NOW(), NOW()),
  ('г. Чита, ул. Красной Звезды, 51', 'Склад горюче-смазочных материалов', 5, NOW(), NOW()),
  ('г. Чита, ул. Богомягкова, 23', 'Гостиница "Забайкалье"', 3, NOW(), NOW()),
  ('г. Чита, ул. Петровская, 1', 'Краевая клиническая больница', 4, NOW(), NOW()),
  ('г. Чита, ул. Нагорная, 26', 'Школа №49', 4, NOW(), NOW()),
  ('г. Чита, ул. Шилова, 86', 'Дворец спорта "Мегаполис-Спорт"', 4, NOW(), NOW()),
  ('г. Чита, ул. Ленина, 88', 'Гостиница "Монблан"', 3, NOW(), NOW()),
  ('г. Чита, ул. Юбилейная, 13', 'Детский сад №88', 3, NOW(), NOW()),
  ('г. Чита, ул. Анохина, 46', 'Драматический театр', 4, NOW(), NOW()),
  ('г. Чита, ул. Профсоюзная, 5', 'Бизнес-центр "Эльдорадо"', 3, NOW(), NOW()),
  ('г. Чита, ул. Горького, 39а', 'ТЦ "Царский"', 4, NOW(), NOW()),
  ('г. Чита, ул. Крылова, 2', 'Магазин пиротехники', 5, NOW(), NOW()),
  ('г. Чита, ул. Чайковского, 14', 'Краевая детская клиническая больница', 4, NOW(), NOW()),
  ('г. Чита, Аэропорт "Кадала"', 'Аэровокзал и прилегающие сооружения', 5, NOW(), NOW()),
  ('г. Чита, ул. Недорезова, 16а', 'Мебельная фабрика', 4, NOW(), NOW());

-- Настройки системы
INSERT INTO system_settings (default_city_name, default_latitude, default_longitude, default_zoom, updated_at)
VALUES ('Чита', 52.0515, 113.4712, 12, NOW())
ON CONFLICT (id) DO UPDATE 
SET default_city_name = EXCLUDED.default_city_name,
    default_latitude = EXCLUDED.default_latitude,
    default_longitude = EXCLUDED.default_longitude,
    default_zoom = EXCLUDED.default_zoom,
    updated_at = EXCLUDED.updated_at; 