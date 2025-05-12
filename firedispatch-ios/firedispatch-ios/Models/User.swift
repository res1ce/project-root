import Foundation

enum UserRole: String, Codable {
    case admin = "admin"
    case centralDispatcher = "central_dispatcher" 
    case stationDispatcher = "station_dispatcher"
    
    var displayName: String {
        switch self {
        case .admin:
            return "Администратор"
        case .centralDispatcher:
            return "Центральный диспетчер"
        case .stationDispatcher:
            return "Диспетчер пожарной части"
        }
    }
}

struct User: Codable, Identifiable {
    let id: Int
    let username: String
    let name: String?
    let role: UserRole
    let fireStationId: Int?
    
    enum CodingKeys: String, CodingKey {
        case id, username, name, role
        case fireStationId = "fireStationId"
    }
}

struct AuthResponse: Codable {
    let accessToken: String
    let user: User
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case user
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.accessToken = try container.decode(String.self, forKey: .accessToken)
        self.user = try container.decode(User.self, forKey: .user)
        
        // Для отладки
        print("Successfully decoded AuthResponse with token: \(accessToken.prefix(10))...")
        print("User: id=\(user.id), username=\(user.username), role=\(user.role.rawValue)")
    }
} 