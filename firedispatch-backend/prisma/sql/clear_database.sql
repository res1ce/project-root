-- Скрипт для очистки базы данных перед заполнением новыми данными
-- Отключаем внешние ключи на время удаления
SET session_replication_role = 'replica';

-- Очистка таблиц в правильном порядке
TRUNCATE TABLE fire_history CASCADE;
TRUNCATE TABLE user_activities CASCADE;
TRUNCATE TABLE reports CASCADE;
TRUNCATE TABLE fire_incidents CASCADE;
TRUNCATE TABLE fire_address_levels CASCADE;
TRUNCATE TABLE fire_level_requirements CASCADE;
TRUNCATE TABLE vehicles CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE fire_stations CASCADE;
TRUNCATE TABLE fire_levels CASCADE;
TRUNCATE TABLE system_settings CASCADE;

-- Сбрасываем автоинкрементные последовательности
ALTER SEQUENCE fire_history_id_seq RESTART WITH 1;
ALTER SEQUENCE user_activities_id_seq RESTART WITH 1;
ALTER SEQUENCE reports_id_seq RESTART WITH 1;
ALTER SEQUENCE fire_incidents_id_seq RESTART WITH 1;
ALTER SEQUENCE fire_address_levels_id_seq RESTART WITH 1;
ALTER SEQUENCE fire_level_requirements_id_seq RESTART WITH 1;
ALTER SEQUENCE vehicles_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE fire_stations_id_seq RESTART WITH 1;
ALTER SEQUENCE fire_levels_id_seq RESTART WITH 1;
ALTER SEQUENCE system_settings_id_seq RESTART WITH 1;

-- Включаем обратно внешние ключи
SET session_replication_role = 'origin'; 