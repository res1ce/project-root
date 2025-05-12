import Foundation
import Combine
import SwiftUI

class AdminViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var error: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    func loadUsers() {
        isLoading = true
        error = nil
        
        APIService.shared.getUsers()
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                
                if case .failure(let error) = completion {
                    self?.error = error.description
                }
            }, receiveValue: { [weak self] users in
                self?.users = users
            })
            .store(in: &cancellables)
    }
    
    func createUser(username: String, password: String, role: UserRole, name: String, fireStationId: Int?) {
        isLoading = true
        error = nil
        
        APIService.shared.createUser(username: username, password: password, role: role, name: name, fireStationId: fireStationId)
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                
                if case .failure(let error) = completion {
                    self?.error = error.description
                }
            }, receiveValue: { [weak self] user in
                self?.users.append(user)
            })
            .store(in: &cancellables)
    }
} 