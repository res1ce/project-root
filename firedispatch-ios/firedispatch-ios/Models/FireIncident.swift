import Foundation
import CoreLocation

enum IncidentStatus: String, Codable, CaseIterable {
    case pending = "PENDING"
    case inProgress = "IN_PROGRESS"
    case resolved = "RESOLVED"
    case cancelled = "CANCELLED"
    
    var displayName: String {
        switch self {
        case .pending:
            return "Ожидание"
        case .inProgress:
            return "В процессе"
        case .resolved:
            return "Разрешен"
        case .cancelled:
            return "Отменен"
        }
    }
    
    var color: String {
        switch self {
        case .pending:
            return "yellow"
        case .inProgress:
            return "orange"
        case .resolved:
            return "green"
        case .cancelled:
            return "gray"
        }
    }
}

struct FireLevel: Codable, Identifiable {
    let id: Int
    let level: Int
    let name: String
    let description: String
}

struct FireStation: Codable, Identifiable {
    let id: Int
    let name: String
    let address: String
    let latitude: Double
    let longitude: Double
    let phoneNumber: String?
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

struct Vehicle: Codable, Identifiable {
    let id: Int
    let model: String
    let type: String
    let status: String
    let fireStationId: Int
}

struct FireIncident: Codable, Identifiable {
    let id: Int
    let latitude: Double
    let longitude: Double
    let status: IncidentStatus
    let description: String?
    let address: String?
    let createdAt: Date
    let updatedAt: Date?
    let resolvedAt: Date?
    let reportedById: Int
    let assignedToId: Int
    let fireStationId: Int
    let fireLevelId: Int
    
    // Опциональные связанные объекты
    var fireLevel: FireLevel?
    var fireStation: FireStation?
    var vehicles: [Vehicle]?
    
    // Дополнительные поля для совместимости с форматом от фронтенда/сокета
    var level: FireLevel?
    var assignedStation: FireStation?
    var location: [Double]?
    var readableStatus: String?
    
    var coordinate: CLLocationCoordinate2D {
        if let location = location, location.count >= 2 {
            // Формат location [lng, lat]
            return CLLocationCoordinate2D(latitude: location[1], longitude: location[0])
        }
        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
    
    enum CodingKeys: String, CodingKey {
        case id, latitude, longitude, status, description, address
        case createdAt, updatedAt, resolvedAt
        case reportedById, assignedToId, fireStationId, fireLevelId
        case fireLevel, fireStation, vehicles
        
        // Дополнительные ключи для совместимости
        case level, assignedStation, location, readableStatus
        case levelId // альтернативное имя для fireLevelId
        case assignedStationId // альтернативное имя для fireStationId
        case engines // для поля vehicles в другом формате
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Обязательное поле
        id = try container.decode(Int.self, forKey: .id)
        
        // Обработка координат - могут быть в нескольких форматах
        if let location = try? container.decodeIfPresent([Double].self, forKey: .location), location.count >= 2 {
            self.location = location
            // location в формате [lng, lat]
            longitude = location[0]
            latitude = location[1]
        } else {
            // Пробуем получить координаты напрямую
            latitude = (try? container.decode(Double.self, forKey: .latitude)) ?? 0
            longitude = (try? container.decode(Double.self, forKey: .longitude)) ?? 0
        }
        
        // Обработка статуса
        if let statusString = try? container.decode(String.self, forKey: .status) {
            status = IncidentStatus(rawValue: statusString) ?? .pending
        } else {
            status = .pending
        }
        readableStatus = try? container.decodeIfPresent(String.self, forKey: .readableStatus)
        
        // Дополнительные поля
        description = try? container.decodeIfPresent(String.self, forKey: .description)
        address = try? container.decodeIfPresent(String.self, forKey: .address)
        
        // Даты
        let dateDecoder = JSONDecoder()
        dateDecoder.dateDecodingStrategy = .iso8601
        
        if let createdAtString = try? container.decode(String.self, forKey: .createdAt) {
            if let date = ISO8601DateFormatter().date(from: createdAtString) {
                createdAt = date
            } else {
                createdAt = Date()
            }
        } else {
            createdAt = Date()
        }
        
        if let updatedAtString = try? container.decodeIfPresent(String.self, forKey: .updatedAt),
           let date = ISO8601DateFormatter().date(from: updatedAtString) {
            updatedAt = date
        } else {
            updatedAt = nil
        }
        
        if let resolvedAtString = try? container.decodeIfPresent(String.self, forKey: .resolvedAt),
           let date = ISO8601DateFormatter().date(from: resolvedAtString) {
            resolvedAt = date
        } else {
            resolvedAt = nil
        }
        
        // ID связанных сущностей - могут быть в разных полях
        reportedById = try container.decodeIfPresent(Int.self, forKey: .reportedById) ?? 0
        assignedToId = try container.decodeIfPresent(Int.self, forKey: .assignedToId) ?? 0
        
        // Уровень пожара
        if let fireLevelId = try? container.decodeIfPresent(Int.self, forKey: .fireLevelId) {
            self.fireLevelId = fireLevelId
        } else if let levelId = try? container.decodeIfPresent(Int.self, forKey: .levelId) {
            self.fireLevelId = levelId
        } else {
            self.fireLevelId = 1 // Значение по умолчанию
        }
        
        // Станция
        if let fireStationId = try? container.decodeIfPresent(Int.self, forKey: .fireStationId) {
            self.fireStationId = fireStationId
        } else if let assignedStationId = try? container.decodeIfPresent(Int.self, forKey: .assignedStationId) {
            self.fireStationId = assignedStationId
        } else {
            self.fireStationId = 0 // Значение по умолчанию
        }
        
        // Связанные объекты
        fireLevel = try? container.decodeIfPresent(FireLevel.self, forKey: .fireLevel)
        level = try? container.decodeIfPresent(FireLevel.self, forKey: .level)
        fireStation = try? container.decodeIfPresent(FireStation.self, forKey: .fireStation)
        assignedStation = try? container.decodeIfPresent(FireStation.self, forKey: .assignedStation)
        
        // Обработка разных форматов для vehicles/engines
        if let vehs = try? container.decodeIfPresent([Vehicle].self, forKey: .vehicles) {
            vehicles = vehs
        } else if let engs = try? container.decodeIfPresent([Vehicle].self, forKey: .engines) {
            vehicles = engs
        } else {
            vehicles = []
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(id, forKey: .id)
        try container.encode(latitude, forKey: .latitude)
        try container.encode(longitude, forKey: .longitude)
        try container.encode(status, forKey: .status)
        try container.encodeIfPresent(description, forKey: .description)
        try container.encodeIfPresent(address, forKey: .address)
        
        let formatter = ISO8601DateFormatter()
        try container.encode(formatter.string(from: createdAt), forKey: .createdAt)
        if let updatedAt = updatedAt {
            try container.encode(formatter.string(from: updatedAt), forKey: .updatedAt)
        }
        if let resolvedAt = resolvedAt {
            try container.encode(formatter.string(from: resolvedAt), forKey: .resolvedAt)
        }
        
        try container.encode(reportedById, forKey: .reportedById)
        try container.encode(assignedToId, forKey: .assignedToId)
        try container.encode(fireStationId, forKey: .fireStationId)
        try container.encode(fireLevelId, forKey: .fireLevelId)
        
        try container.encodeIfPresent(fireLevel, forKey: .fireLevel)
        try container.encodeIfPresent(fireStation, forKey: .fireStation)
        try container.encodeIfPresent(vehicles, forKey: .vehicles)
    }
}

struct ChangeFireLevelRequest: Codable {
    let fireLevelId: Int
}

struct ChangeFireStatusRequest: Codable {
    let status: IncidentStatus
}

struct CreateFireRequest: Codable {
    let latitude: Double
    let longitude: Double
    let address: String?
    let description: String?
    let fireLevelId: Int
} 