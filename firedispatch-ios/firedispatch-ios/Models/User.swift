import Foundation

enum UserRole: String, Codable {
    case admin = "admin"
    case central_dispatcher = "central_dispatcher"
    case station_dispatcher = "station_dispatcher"
    
    var displayName: String {
        switch self {
        case .admin:
            return "Администратор"
        case .central_dispatcher:
            return "Центральный диспетчер"
        case .station_dispatcher:
            return "Диспетчер пожарной части"
        }
    }
}

// Вспомогательные структуры для декодирования
struct RoleObject: Codable {
    let id: Int?
    let name: String?
    let value: String?
    let displayName: String?
}

struct FireStationObject: Codable {
    let id: Int
    let name: String
}

struct User: Codable, Identifiable {
    let id: Int
    let username: String
    let role: UserRole
    let fireStationId: Int?
    let name: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case username
        case role
        case roleId
        case roleName
        case fireStationId = "firestation_id"
        case fireStation
        case name
    }
    
    // Метод для кодирования объекта
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(id, forKey: .id)
        try container.encode(username, forKey: .username)
        try container.encode(role, forKey: .role)
        try container.encodeIfPresent(fireStationId, forKey: .fireStationId)
        try container.encodeIfPresent(name, forKey: .name)
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Декодируем id
        if let idInt = try? container.decode(Int.self, forKey: .id) {
            id = idInt
        } else if let idString = try? container.decode(String.self, forKey: .id),
                  let idInt = Int(idString) {
            id = idInt
        } else {
            throw DecodingError.dataCorruptedError(forKey: .id, in: container, debugDescription: "Expected Int or String for id")
        }
        
        // Декодируем username
        username = try container.decode(String.self, forKey: .username)
        
        // Декодируем name (опционально)
        name = try container.decodeIfPresent(String.self, forKey: .name)
        
        // Декодируем role, которая может быть представлена разными способами
        // Сначала пробуем получить roleString из различных источников
        var roleString: String? = nil
        
        // Пробуем декодировать напрямую как строку
        if let directRoleString = try? container.decode(String.self, forKey: .role) {
            roleString = directRoleString
        }
        // Пробуем декодировать как объект RoleObject
        else if let roleObject = try? container.decode(RoleObject.self, forKey: .role) {
            if let value = roleObject.value {
                roleString = value
            } else if let name = roleObject.name {
                roleString = name
            }
        }
        // Пробуем декодировать как roleName
        else if let name = try? container.decode(String.self, forKey: .roleName) {
            roleString = name
        }
        
        // Если нашли roleString, пробуем преобразовать в UserRole
        if let roleString = roleString {
            // Пробуем прямое соответствие
            if let roleEnum = UserRole(rawValue: roleString) {
                role = roleEnum
            }
            // Пробуем преобразовать с учетом возможных вариаций
            else {
                let lowercased = roleString.lowercased()
                if lowercased.contains("admin") {
                    role = .admin
                } else if lowercased.contains("central") || lowercased.contains("центральный") {
                    role = .central_dispatcher
                } else if lowercased.contains("station") || lowercased.contains("пожарной") {
                    role = .station_dispatcher
                } else {
                    // Если не смогли определить по строке, используем значение по умолчанию
                    role = .station_dispatcher
                }
            }
        }
        // Если не нашли roleString, пробуем определить по roleId
        else if let roleId = try? container.decode(Int.self, forKey: .roleId) {
            switch roleId {
            case 1:
                role = .admin
            case 2:
                role = .central_dispatcher
            case 3:
                role = .station_dispatcher
            default:
                // Если неизвестный roleId, используем значение по умолчанию
                role = .station_dispatcher
            }
        }
        // Если ничего не нашли, используем значение по умолчанию
        else {
            role = .admin // Меняем значение по умолчанию на admin для тестирования
        }
        
        // Декодируем fireStationId, который может быть представлен разными способами
        if let fireStationIdInt = try? container.decodeIfPresent(Int.self, forKey: .fireStationId) {
            // Если fireStationId представлен как Int
            fireStationId = fireStationIdInt
        } else if let fireStationIdString = try? container.decodeIfPresent(String.self, forKey: .fireStationId),
                  let fireStationIdInt = Int(fireStationIdString) {
            // Если fireStationId представлен как String
            fireStationId = fireStationIdInt
        } else if let fireStation = try? container.decodeIfPresent(FireStationObject.self, forKey: .fireStation) {
            // Если есть объект fireStation с полем id
            fireStationId = fireStation.id
        } else {
            // Если не удалось определить fireStationId
            fireStationId = nil
        }
    }
}

struct AuthResponse: Codable {
    let access_token: String
    let user: User
}

struct LoginRequest: Codable {
    let username: String
    let password: String
}

struct CreateUserRequest: Codable {
    let username: String
    let password: String
    let role: UserRole
    let name: String?
    let fireStationId: Int?
}
