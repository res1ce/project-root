import Foundation
import Combine
import SwiftUI

class AuthViewModel: ObservableObject {
    @Published var user: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var error: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        loadSavedUser()
    }
    
    func login(username: String, password: String) {
        isLoading = true
        error = nil
        
        APIService.shared.login(username: username, password: password)
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                
                if case .failure(let error) = completion {
                    self?.error = error.description
                }
            }, receiveValue: { [weak self] response in
                self?.user = response.user
                self?.isAuthenticated = true
                self?.saveUser(response)
                
                // Устанавливаем токен для API и WebSocket
                APIService.shared.setToken(response.accessToken)
                WebSocketService.shared.setToken(response.accessToken)
                
                // Передаем пользователя в WebSocketService
                WebSocketService.shared.setUser(response.user)
                
                // Подключаемся к WebSocket
                WebSocketService.shared.connect()
            })
            .store(in: &cancellables)
    }
    
    func logout() {
        // Отключаемся от WebSocket
        WebSocketService.shared.disconnect()
        
        user = nil
        isAuthenticated = false
        
        // Удаляем сохраненные данные
        UserDefaults.standard.removeObject(forKey: "authUser")
        UserDefaults.standard.removeObject(forKey: "authToken")
    }
    
    private func saveUser(_ authResponse: AuthResponse) {
        if let userData = try? JSONEncoder().encode(authResponse.user) {
            UserDefaults.standard.set(userData, forKey: "authUser")
            UserDefaults.standard.set(authResponse.accessToken, forKey: "authToken")
        }
    }
    
    private func loadSavedUser() {
        if let userData = UserDefaults.standard.data(forKey: "authUser"),
           let savedUser = try? JSONDecoder().decode(User.self, from: userData),
           let token = UserDefaults.standard.string(forKey: "authToken") {
            
            user = savedUser
            isAuthenticated = true
            
            // Устанавливаем токен для API и WebSocket
            APIService.shared.setToken(token)
            WebSocketService.shared.setToken(token)
            
            // Передаем пользователя в WebSocketService
            WebSocketService.shared.setUser(savedUser)
            
            // Подключаемся к WebSocket
            WebSocketService.shared.connect()
        }
    }
} 