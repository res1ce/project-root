import Foundation
import Combine
// Импортируем NetworkConfig для настроек сети

enum APIError: Error, Equatable {
    case invalidURL
    case requestFailed(Error)
    case decodingFailed(Error)
    case invalidResponse
    case serverError(Int, String)
    case unauthorized
    case unknown
    
    static func == (lhs: APIError, rhs: APIError) -> Bool {
        switch (lhs, rhs) {
        case (.invalidURL, .invalidURL),
             (.invalidResponse, .invalidResponse),
             (.unauthorized, .unauthorized),
             (.unknown, .unknown):
            return true
        case (.serverError(let lhsCode, let lhsMessage), .serverError(let rhsCode, let rhsMessage)):
            return lhsCode == rhsCode && lhsMessage == rhsMessage
        case (.requestFailed, .requestFailed),
             (.decodingFailed, .decodingFailed):
            // Ошибки не могут быть напрямую сравнены, поэтому сравниваем только типы
            return true
        default:
            return false
        }
    }
    
    var message: String {
        switch self {
        case .invalidURL:
            return "Неверный URL"
        case .requestFailed(let error):
            return "Ошибка запроса: \(error.localizedDescription)"
        case .decodingFailed(let error):
            return "Ошибка декодирования: \(error.localizedDescription)"
        case .invalidResponse:
            return "Некорректный ответ от сервера"
        case .serverError(let code, let message):
            return "Ошибка сервера (\(code)): \(message)"
        case .unauthorized:
            return "Необходима авторизация"
        case .unknown:
            return "Неизвестная ошибка"
        }
    }
}

class APIService {
    static let shared = APIService()
    
    private let baseURL = NetworkConfig.baseURL
    private var token: String?
    
    private init() {}
    
    func setToken(_ token: String) {
        self.token = token
    }
    
    func clearToken() {
        self.token = nil
    }
    
    // Метод для запросов с телом
    func request<T: Decodable, E: Encodable>(
        endpoint: String,
        method: String,
        body: E
    ) -> AnyPublisher<T, APIError> {
        return performRequest(endpoint: endpoint, method: method, body: body)
    }
    
    // Метод для запросов без тела
    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET"
    ) -> AnyPublisher<T, APIError> {
        return performRequest(endpoint: endpoint, method: method, body: nil as Empty?)
    }
    
    // Внутренний метод, который выполняет запрос
    private func performRequest<T: Decodable, E: Encodable>(
        endpoint: String,
        method: String,
        body: E?
    ) -> AnyPublisher<T, APIError> {
        guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = token {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            do {
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                return Fail(error: APIError.requestFailed(error)).eraseToAnyPublisher()
            }
        }
        
        // Используем настроенную сессию из NetworkConfig
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                
                switch httpResponse.statusCode {
                case 200...299:
                    return data
                case 401:
                    throw APIError.unauthorized
                default:
                    let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                    throw APIError.serverError(httpResponse.statusCode, errorMessage)
                }
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else if error is DecodingError {
                    return APIError.decodingFailed(error)
                } else {
                    return APIError.requestFailed(error)
                }
            }
            .eraseToAnyPublisher()
    }
}
