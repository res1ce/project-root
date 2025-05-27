import SwiftUI
import Combine

class AppState: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = true
    @Published var currentUser: User? = nil
    
    private var authService = AuthService.shared
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        checkAuthStatus()
    }
    
    func checkAuthStatus() {
        isLoading = true
        
        if authService.isLoggedIn() {
            // Проверяем токен и получаем данные пользователя
            authService.checkToken()
                .receive(on: DispatchQueue.main)
                .sink(
                    receiveCompletion: { [weak self] completion in
                        self?.isLoading = false
                        
                        if case .failure = completion {
                            // Если токен недействителен, выходим из системы
                            self?.logout()
                        }
                    },
                    receiveValue: { [weak self] user in
                        self?.isLoading = false
                        
                        // Проверяем, что пользователь является администратором
                        if user.role == .admin {
                            self?.currentUser = user
                            self?.isAuthenticated = true
                        } else {
                            // Если пользователь не администратор, выходим из системы
                            self?.logout()
                        }
                    }
                )
                .store(in: &cancellables)
        } else {
            isLoading = false
            isAuthenticated = false
            currentUser = nil
        }
    }
    
    func login(username: String, password: String, completion: @escaping (Result<User, APIError>) -> Void) {
        authService.login(username: username, password: password)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completionResult in
                    if case .failure(let error) = completionResult {
                        completion(.failure(error))
                        self?.isLoading = false
                    }
                },
                receiveValue: { [weak self] user in
                    // Проверяем, что пользователь является администратором
                    if user.role == .admin {
                        self?.currentUser = user
                        self?.isAuthenticated = true
                        completion(.success(user))
                    } else {
                        // Если пользователь не администратор, выходим из системы
                        self?.authService.logout()
                        completion(.failure(.unauthorized))
                    }
                    self?.isLoading = false
                }
            )
            .store(in: &cancellables)
    }
    
    func logout() {
        authService.logout()
        isAuthenticated = false
        currentUser = nil
    }
}
