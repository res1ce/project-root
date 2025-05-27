import Foundation
import Combine

class UserService {
    static let shared = UserService()
    
    private let apiService = APIService.shared
    
    private init() {}
    
    func createUser(username: String, password: String, role: UserRole, name: String? = nil, fireStationId: Int? = nil) -> AnyPublisher<User, APIError> {
        let request = CreateUserRequest(
            username: username,
            password: password,
            role: role,
            name: name,
            fireStationId: fireStationId
        )
        
        return apiService.request(endpoint: "user", method: "POST", body: request)
            .eraseToAnyPublisher()
    }
    
    func getAllUsers() -> AnyPublisher<[User], APIError> {
        return apiService.request<[User]>(endpoint: "user", method: "GET")
            .eraseToAnyPublisher()
    }
    
    func getUserActivity(userId: Int? = nil, limit: Int = 100) -> AnyPublisher<[UserActivity], APIError> {
        var endpoint = "user/activity"
        
        if let userId = userId {
            endpoint += "?userId=\(userId)"
            if limit != 100 {
                endpoint += "&limit=\(limit)"
            }
        } else if limit != 100 {
            endpoint += "?limit=\(limit)"
        }
        
        return apiService.request<[UserActivity]>(endpoint: endpoint, method: "GET")
            .eraseToAnyPublisher()
    }
    
    func getActivityStats() -> AnyPublisher<ActivityStats, APIError> {
        return apiService.request<ActivityStats>(endpoint: "user/activity/stats", method: "GET")
            .eraseToAnyPublisher()
    }
    
    func updateUser(id: Int, name: String?, role: UserRole, fireStationId: Int?) -> AnyPublisher<User, APIError> {
        print("\n\n===== Формируем запрос на обновление пользователя =====")
        print("ID пользователя: \(id)")
        print("Имя: \(name as Any)")
        print("Роль: \(role.rawValue)")
        print("ID пожарной части: \(fireStationId as Any)")
        
        // Используем структуру для запроса, точно такую же, как в фронтенде
        struct UpdateUserRequest: Encodable {
            let name: String?
            let roleId: Int  // На бэкенде используется поле roleId для обновления поля role в базе данных
            let fireStationId: Int?
            
            enum CodingKeys: String, CodingKey {
                case name
                case roleId
                case fireStationId
            }
        }
        
        // Преобразуем роль в roleId, как это делается во фронтенде
        let roleId: Int
        switch role {
        case .admin:
            roleId = 1
        case .central_dispatcher:
            roleId = 2
        case .station_dispatcher:
            roleId = 3
        }
        
        // Создаем запрос с необходимыми полями
        let request = UpdateUserRequest(
            name: name,
            roleId: roleId,
            fireStationId: fireStationId
        )
        
        // Выводим запрос для отладки
        do {
            let jsonData = try JSONEncoder().encode(request)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print("\nЗапрос JSON: \(jsonString)")
            }
        } catch {
            print("Ошибка при кодировании JSON: \(error)")
        }
        print("===========================================\n\n")
        
        return apiService.request(endpoint: "user/\(id)", method: "PUT", body: request)
            .eraseToAnyPublisher()
    }
}

struct UserActivity: Codable, Identifiable {
    let id: Int
    let userId: Int
    let action: String
    let details: String?
    let timestamp: String
    let user: User
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case action
        case details
        case timestamp
        case user
    }
}

struct ActivityStats: Codable {
    let stats: [String: Int]
    let totalUsers: Int
    let activityToday: Int
    let totalActivity: Int
}
