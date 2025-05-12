import Foundation
import Combine

enum APIError: Error {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case decodingError(Error)
    case unknown(Error)
    
    var description: String {
        switch self {
        case .invalidURL:
            return "Неверный URL"
        case .invalidResponse:
            return "Неверный ответ от сервера"
        case .httpError(let code):
            return "Ошибка HTTP: \(code)"
        case .decodingError(let error):
            return "Ошибка декодирования: \(error.localizedDescription)"
        case .unknown(let error):
            return "Неизвестная ошибка: \(error.localizedDescription)"
        }
    }
}

class APIService {
    static let shared = APIService()
    
    private init() {}
    
    // Используем IP-адрес или hostname вместо localhost для работы на реальном устройстве
    // Для симулятора подойдет localhost, для реального устройства нужен IP-адрес компьютера
    #if targetEnvironment(simulator)
    private let baseURL = "http://localhost:3000/api"
    private let wsURL = "http://localhost:3000"
    #else
    // Замените на фактический IP вашего компьютера в локальной сети
    private let baseURL = "http://192.168.1.100:3000/api"
    private let wsURL = "http://192.168.1.100:3000"
    #endif
    
    private var token: String?
    
    func setToken(_ token: String) {
        self.token = token
    }
    
    func getWSURL() -> String {
        return wsURL
    }
    
    private func createRequest(_ path: String, method: String, body: Data? = nil) -> URLRequest? {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            return nil
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = token {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        return request
    }
    
    func login(username: String, password: String) -> AnyPublisher<AuthResponse, APIError> {
        guard let url = URL(string: "\(baseURL)/auth/login") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        let loginData = ["username": username, "password": password]
        guard let jsonData = try? JSONEncoder().encode(loginData) else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                print("Login response status: \(httpResponse.statusCode)")
                if let responseString = String(data: data, encoding: .utf8) {
                    print("Response data: \(responseString)")
                }
                
                if httpResponse.statusCode != 200 && httpResponse.statusCode != 201 {
                    throw APIError.httpError(httpResponse.statusCode)
                }
                
                return data
            }
            .decode(type: AuthResponse.self, decoder: JSONDecoder())
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let _ = error as? URLError {
                    return APIError.invalidURL
                } else if let error = error as? DecodingError {
                    print("Decoding error: \(error)")
                    return APIError.decodingError(error)
                } else {
                    return APIError.unknown(error)
                }
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Users
    
    func getUsers() -> AnyPublisher<[User], APIError> {
        guard let request = createRequest("/user", method: "GET") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                if httpResponse.statusCode != 200 {
                    throw APIError.httpError(httpResponse.statusCode)
                }
                
                return data
            }
            .decode(type: [User].self, decoder: JSONDecoder())
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let _ = error as? URLError {
                    return APIError.invalidURL
                } else if let error = error as? DecodingError {
                    return APIError.decodingError(error)
                } else {
                    return APIError.unknown(error)
                }
            }
            .eraseToAnyPublisher()
    }
    
    func createUser(username: String, password: String, role: UserRole, name: String, fireStationId: Int?) -> AnyPublisher<User, APIError> {
        guard let url = URL(string: "\(baseURL)/user") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        var userData = [
            "username": username,
            "password": password,
            "role": role.rawValue.uppercased(),
            "name": name
        ] as [String: Any]
        
        if let fireStationId = fireStationId {
            userData["fireStationId"] = fireStationId
        }
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: userData) else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData
        
        if let token = token {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                if httpResponse.statusCode != 201 {
                    throw APIError.httpError(httpResponse.statusCode)
                }
                
                return data
            }
            .decode(type: User.self, decoder: JSONDecoder())
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let _ = error as? URLError {
                    return APIError.invalidURL
                } else if let error = error as? DecodingError {
                    return APIError.decodingError(error)
                } else {
                    return APIError.unknown(error)
                }
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Fire Stations
    
    func getFireStations() -> AnyPublisher<[FireStation], APIError> {
        guard let request = createRequest("/fire-station", method: "GET") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                if httpResponse.statusCode != 200 {
                    throw APIError.httpError(httpResponse.statusCode)
                }
                
                return data
            }
            .decode(type: [FireStation].self, decoder: JSONDecoder())
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let _ = error as? URLError {
                    return APIError.invalidURL
                } else if let error = error as? DecodingError {
                    return APIError.decodingError(error)
                } else {
                    return APIError.unknown(error)
                }
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Fire Levels
    
    func getFireLevels() -> AnyPublisher<[FireLevel], APIError> {
        guard let request = createRequest("/fire/level", method: "GET") else {
            return getDefaultFireLevels()
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                print("getFireLevels response status: \(httpResponse.statusCode)")
                
                // Если ошибка доступа или любая другая ошибка, выбрасываем исключение
                if httpResponse.statusCode != 200 {
                    if httpResponse.statusCode == 403 || httpResponse.statusCode == 401 {
                        print("Нет прав для получения уровней пожаров, используем значения по умолчанию")
                    } else {
                        print("Ошибка при получении уровней пожаров: \(httpResponse.statusCode), используем значения по умолчанию")
                    }
                    
                    throw APIError.httpError(httpResponse.statusCode)
                }
                
                return data
            }
            .decode(type: [FireLevel].self, decoder: JSONDecoder())
            .mapError { error -> APIError in
                if let apiError = error as? APIError {
                    return apiError
                } else if let _ = error as? URLError {
                    return APIError.invalidURL
                } else if let error = error as? DecodingError {
                    print("Ошибка декодирования при получении уровней пожаров: \(error)")
                    return APIError.decodingError(error)
                } else {
                    return APIError.unknown(error)
                }
            }
            .catch { error -> AnyPublisher<[FireLevel], APIError> in
                print("Перехватываем ошибку: \(error.description), возвращаем дефолтные уровни")
                return self.getDefaultFireLevels()
            }
            .eraseToAnyPublisher()
    }
    
    // Вспомогательная функция для получения дефолтных уровней пожаров
    private func getDefaultFireLevels() -> AnyPublisher<[FireLevel], APIError> {
        // Дефолтные уровни, такие же как во фронтенде
        let defaultLevels: [[String: Any]] = [
            ["id": 1, "level": 1, "name": "Уровень 1", "description": "Небольшой пожар"],
            ["id": 2, "level": 2, "name": "Уровень 2", "description": "Средний пожар"],
            ["id": 3, "level": 3, "name": "Уровень 3", "description": "Крупный пожар"],
            ["id": 4, "level": 4, "name": "Уровень 4", "description": "Особо крупный пожар"],
            ["id": 5, "level": 5, "name": "Уровень 5", "description": "Чрезвычайная ситуация"]
        ]
        
        do {
            let defaultData = try JSONSerialization.data(withJSONObject: defaultLevels)
            let defaultLevelObjects = try JSONDecoder().decode([FireLevel].self, from: defaultData)
            print("Возвращаем дефолтные уровни пожаров")
            return Just(defaultLevelObjects)
                .setFailureType(to: APIError.self)
                .eraseToAnyPublisher()
        } catch {
            print("Ошибка при создании дефолтных уровней пожаров: \(error)")
            return Fail(error: APIError.unknown(error)).eraseToAnyPublisher()
        }
    }
    
    // MARK: - Fire Incidents
    
    func getFireIncidents() -> AnyPublisher<[FireIncident], APIError> {
        guard let request = createRequest("/fire", method: "GET") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                print("getFireIncidents response status: \(httpResponse.statusCode)")
                
                if httpResponse.statusCode != 200 {
                    throw APIError.httpError(httpResponse.statusCode)
                }
                
                // Выводим JSON для отладки
                if let jsonString = String(data: data, encoding: .utf8) {
                    print("Полученные данные пожаров: \(jsonString)")
                }
                
                return data
            }
            .decode(type: [FireIncident].self, decoder: decoder)
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let _ = error as? URLError {
                    return APIError.invalidURL
                } else if let error = error as? DecodingError {
                    print("Ошибка декодирования: \(error)")
                    
                    switch error {
                    case let .typeMismatch(type, context):
                        print("Несоответствие типа: ожидался \(type), контекст: \(context)")
                    case let .valueNotFound(type, context):
                        print("Значение не найдено для типа \(type), контекст: \(context)")
                    case let .keyNotFound(key, context):
                        print("Ключ не найден: \(key), контекст: \(context)")
                    case let .dataCorrupted(context):
                        print("Данные повреждены, контекст: \(context)")
                    @unknown default:
                        print("Неизвестная ошибка декодирования")
                    }
                    
                    return APIError.decodingError(error)
                } else {
                    return APIError.unknown(error)
                }
            }
            .eraseToAnyPublisher()
    }
    
    func createFireIncident(latitude: Double, longitude: Double, address: String?, description: String?, fireLevelId: Int) -> AnyPublisher<FireIncident, APIError> {
        guard let url = URL(string: "\(baseURL)/fire") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        let fireData = CreateFireRequest(
            latitude: latitude,
            longitude: longitude,
            address: address,
            description: description,
            fireLevelId: fireLevelId
        )
        
        guard let jsonData = try? JSONEncoder().encode(fireData) else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData
        
        if let token = token {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                if httpResponse.statusCode != 201 {
                    throw APIError.httpError(httpResponse.statusCode)
                }
                
                return data
            }
            .decode(type: FireIncident.self, decoder: decoder)
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let _ = error as? URLError {
                    return APIError.invalidURL
                } else if let error = error as? DecodingError {
                    return APIError.decodingError(error)
                } else {
                    return APIError.unknown(error)
                }
            }
            .eraseToAnyPublisher()
    }
    
    func changeFireLevel(fireId: Int, fireLevelId: Int) -> AnyPublisher<FireIncident, APIError> {
        guard let url = URL(string: "\(baseURL)/fire/\(fireId)/level") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        // Используем структуру запроса как в бэкенде
        let changeData = ["newLevel": fireLevelId] as [String: Any]
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: changeData) else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData
        
        if let token = token {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        print("Отправка запроса на изменение уровня пожара \(fireId) на \(fireLevelId)")
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                print("Ответ сервера при изменении уровня пожара: \(httpResponse.statusCode)")
                if let responseString = String(data: data, encoding: .utf8) {
                    print("Данные ответа: \(responseString)")
                }
                
                // Проверяем различные коды ошибок
                if httpResponse.statusCode == 403 {
                    print("Ошибка доступа при изменении уровня пожара: нет прав")
                    throw APIError.httpError(httpResponse.statusCode)
                } else if httpResponse.statusCode == 404 {
                    print("Пожар не найден")
                    throw APIError.httpError(httpResponse.statusCode)
                } else if httpResponse.statusCode != 200 {
                    print("Неизвестная ошибка при изменении уровня пожара")
                    throw APIError.httpError(httpResponse.statusCode)
                }
                
                return data
            }
            .decode(type: FireIncident.self, decoder: decoder)
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let _ = error as? URLError {
                    return APIError.invalidURL
                } else if let error = error as? DecodingError {
                    print("Ошибка декодирования при изменении уровня пожара: \(error)")
                    return APIError.decodingError(error)
                } else {
                    return APIError.unknown(error)
                }
            }
            .eraseToAnyPublisher()
    }
    
    func changeFireStatus(fireId: Int, status: IncidentStatus) -> AnyPublisher<FireIncident, APIError> {
        // Для разрешенных пожаров используем отдельный эндпоинт
        let endpoint = status == .resolved ? 
            "/fire/\(fireId)/resolve" : 
            "/fire/\(fireId)/status"
        
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        // Данные для отправки
        var jsonData: Data?
        if status != .resolved {
            let changeData = ["status": status.rawValue]
            jsonData = try? JSONEncoder().encode(changeData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let jsonData = jsonData {
            request.httpBody = jsonData
        }
        
        if let token = token {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        print("Отправка запроса на изменение статуса пожара \(fireId) на \(status.rawValue)")
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                print("Ответ сервера при изменении статуса пожара: \(httpResponse.statusCode)")
                if let responseString = String(data: data, encoding: .utf8) {
                    print("Данные ответа: \(responseString)")
                }
                
                if httpResponse.statusCode != 200 {
                    throw APIError.httpError(httpResponse.statusCode)
                }
                
                return data
            }
            .decode(type: FireIncident.self, decoder: decoder)
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if let _ = error as? URLError {
                    return APIError.invalidURL
                } else if let error = error as? DecodingError {
                    print("Ошибка декодирования при изменении статуса пожара: \(error)")
                    return APIError.decodingError(error)
                } else {
                    return APIError.unknown(error)
                }
            }
            .eraseToAnyPublisher()
    }
} 