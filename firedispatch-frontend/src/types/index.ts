// Пользовательские роли
export type UserRole = 'admin' | 'central_dispatcher' | 'station_dispatcher';

// Пользователь
export interface User {
  id: number;
  username: string;
  role: UserRole;
  fireStationId: number | null;
}

// Авторизация
export interface AuthResponse {
  access_token: string;
  user: User;
}

// Пожарная часть
export interface FireStation {
  id: number;
  name: string;
  location: [number, number]; // [longitude, latitude]
  engines?: FireEngine[];
}

// Тип пожарной машины
export interface FireEngineType {
  id: number;
  name: string;
}

// Пожарная машина
export interface FireEngine {
  id: number;
  model: string;
  typeId: number;
  type?: FireEngineType;
  stationId: number;
  isAvailable: boolean;
}

// Уровень пожара
export interface FireLevel {
  id: number;
  name: string;
  description?: string;
}

// Требования к типам машин для уровня пожара
export interface FireLevelEngineRequirement {
  id: number;
  fireLevelId: number;
  engineTypeId: number;
  count: number;
  engineType?: FireEngineType;
  fireLevel?: FireLevel;
}

// Статус пожара
export type FireStatus = 'active' | 'investigating' | 'dispatched' | 'resolved';

// Пожар
export interface Fire {
  id: number;
  location: [number, number]; // [longitude, latitude]
  levelId: number;
  level?: FireLevel;
  status: FireStatus;
  createdAt: string;
  updatedAt: string;
  assignedStationId: number | null;
  assignedStation?: FireStation;
}

// Назначение пожарных машин
export interface FireAssignment {
  id: number;
  fireId: number;
  stationId: number;
  station?: FireStation;
  engines: FireEngineAssignment[];
  createdAt: string;
}

export interface FireEngineAssignment {
  id: number;
  assignmentId: number;
  engineId: number;
  engine?: FireEngine;
}

// Отчет
export interface Report {
  id: number;
  fireId: number;
  fire?: Fire;
  createdBy: number;
  user?: User;
  content: string;
  createdAt: string;
}

// История изменений пожара
export interface FireHistory {
  id: number;
  fireId: number;
  action: string;
  details: string;
  timestamp: string;
}

// Активность пользователя
export interface UserActivity {
  id: number;
  userId: number;
  user?: User;
  action: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
} 