-- Пользователи системы: администраторы, центральные и станционные диспетчеры

-- Пароль: admin123
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('admin', '$2b$10$iUE.RxTRZgx.QTCqijhvl.tMfGQQzuJ02F6iNGR89TwSgJ1I4.5VG', 'ADMIN', 'Администратор системы', NOW()::timestamp, NOW()::timestamp, NULL);

-- Центральные диспетчеры (не привязаны к конкретной пожарной части)
-- Пароль: central123
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('cd_ivanov', '$2b$10$lF0G7PNIIv2vB/0oc3E5n.f0AEb/XwZCOq7P9eT8UWTSmJF7Xwsoe', 'CENTRAL_DISPATCHER', 'Иванов Иван Иванович', NOW()::timestamp, NOW()::timestamp, NULL),
  ('cd_petrov', '$2b$10$lF0G7PNIIv2vB/0oc3E5n.f0AEb/XwZCOq7P9eT8UWTSmJF7Xwsoe', 'CENTRAL_DISPATCHER', 'Петров Петр Петрович', NOW()::timestamp, NOW()::timestamp, NULL),
  ('cd_sidorov', '$2b$10$lF0G7PNIIv2vB/0oc3E5n.f0AEb/XwZCOq7P9eT8UWTSmJF7Xwsoe', 'CENTRAL_DISPATCHER', 'Сидоров Сидор Сидорович', NOW()::timestamp, NOW()::timestamp, NULL),
  ('cd_smirnov', '$2b$10$lF0G7PNIIv2vB/0oc3E5n.f0AEb/XwZCOq7P9eT8UWTSmJF7Xwsoe', 'CENTRAL_DISPATCHER', 'Смирнов Алексей Владимирович', NOW()::timestamp, NOW()::timestamp, NULL),
  ('cd_kozlov', '$2b$10$lF0G7PNIIv2vB/0oc3E5n.f0AEb/XwZCOq7P9eT8UWTSmJF7Xwsoe', 'CENTRAL_DISPATCHER', 'Козлов Дмитрий Сергеевич', NOW()::timestamp, NOW()::timestamp, NULL);

-- Диспетчеры пожарных частей
-- Пароль: station123
-- 1-я пожарно-спасательная часть
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('sd_volkov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Волков Станислав Игоревич', NOW()::timestamp, NOW()::timestamp, 1),
  ('sd_sokolov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Соколов Виктор Павлович', NOW()::timestamp, NOW()::timestamp, 1);

-- 2-я пожарно-спасательная часть
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('sd_novikov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Новиков Андрей Михайлович', NOW()::timestamp, NOW()::timestamp, 2),
  ('sd_morozov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Морозов Артем Александрович', NOW()::timestamp, NOW()::timestamp, 2);

-- 3-я пожарно-спасательная часть
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('sd_lebedev', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Лебедев Николай Константинович', NOW()::timestamp, NOW()::timestamp, 3),
  ('sd_kuznetsov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Кузнецов Георгий Максимович', NOW()::timestamp, NOW()::timestamp, 3);

-- 4-я пожарно-спасательная часть
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('sd_popov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Попов Евгений Валентинович', NOW()::timestamp, NOW()::timestamp, 4),
  ('sd_vasiliev', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Васильев Семен Федорович', NOW()::timestamp, NOW()::timestamp, 4);

-- 5-я пожарно-спасательная часть
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('sd_mikhailov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Михайлов Руслан Борисович', NOW()::timestamp, NOW()::timestamp, 5),
  ('sd_orlov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Орлов Антон Денисович', NOW()::timestamp, NOW()::timestamp, 5);

-- 6-я пожарно-спасательная часть
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('sd_fedorov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Федоров Владислав Игоревич', NOW()::timestamp, NOW()::timestamp, 6),
  ('sd_andreev', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Андреев Григорий Олегович', NOW()::timestamp, NOW()::timestamp, 6);

-- 7-я пожарно-спасательная часть
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('sd_stepanov', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Степанов Вячеслав Романович', NOW()::timestamp, NOW()::timestamp, 7),
  ('sd_nikitin', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Никитин Кирилл Тимофеевич', NOW()::timestamp, NOW()::timestamp, 7);

-- 8-я пожарно-спасательная часть
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('sd_zaitsev', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Зайцев Даниил Юрьевич', NOW()::timestamp, NOW()::timestamp, 8),
  ('sd_golubev', '$2b$10$rRw1nT46.e9ytMeP2nT/1.jrtvMi3SqOCbGzIeDhSxQCrkXX1QRUm', 'STATION_DISPATCHER', 'Голубев Аркадий Витальевич', NOW()::timestamp, NOW()::timestamp, 8);

-- Административные аккаунты для запасного доступа
INSERT INTO users (username, password, role, name, created_at, updated_at, fire_station_id)
VALUES
  ('super_admin', '$2b$10$iUE.RxTRZgx.QTCqijhvl.tMfGQQzuJ02F6iNGR89TwSgJ1I4.5VG', 'ADMIN', 'Главный администратор МЧС', NOW()::timestamp, NOW()::timestamp, NULL),
  ('central_head', '$2b$10$lF0G7PNIIv2vB/0oc3E5n.f0AEb/XwZCOq7P9eT8UWTSmJF7Xwsoe', 'CENTRAL_DISPATCHER', 'Руководитель диспетчерской службы', NOW()::timestamp, NOW()::timestamp, NULL); 