import Foundation
import Combine

class AuthService {
    static let shared = AuthService()
    
    private let apiService = APIService.shared
    private let tokenKey = "auth_token"
    private let userKey = "current_user"
    
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        // Восстанавливаем токен при инициализации
        if let token = UserDefaults.standard.string(forKey: tokenKey) {
            apiService.setToken(token)
        }
    }
    
    func login(username: String, password: String) -> AnyPublisher<User, APIError> {
        let loginRequest = LoginRequest(username: username, password: password)
        
        return apiService.request<AuthResponse, LoginRequest>(endpoint: "auth/login", method: "POST", body: loginRequest)
            .map { (response: AuthResponse) -> User in
                // Сохраняем токен
                UserDefaults.standard.set(response.access_token, forKey: self.tokenKey)
                self.apiService.setToken(response.access_token)
                
                // Сохраняем данные пользователя
                if let userData = try? JSONEncoder().encode(response.user) {
                    UserDefaults.standard.set(userData, forKey: self.userKey)
                }
                
                return response.user
            }
            .eraseToAnyPublisher()
    }
    
    func logout() {
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: userKey)
        apiService.clearToken()
    }
    
    func getCurrentUser() -> User? {
        guard let userData = UserDefaults.standard.data(forKey: userKey) else {
            return nil
        }
        
        return try? JSONDecoder().decode(User.self, from: userData)
    }
    
    func isLoggedIn() -> Bool {
        return UserDefaults.standard.string(forKey: tokenKey) != nil
    }
    
    func checkToken() -> AnyPublisher<User, APIError> {
        return apiService.request<User>(endpoint: "auth/me", method: "GET")
            .map { (userData: User) -> User in
                // Обновляем данные пользователя
                if let encodedUser = try? JSONEncoder().encode(userData) {
                    UserDefaults.standard.set(encodedUser, forKey: self.userKey)
                }
                return userData
            }
            .eraseToAnyPublisher()
    }
}
