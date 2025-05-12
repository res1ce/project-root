import Foundation
import Combine
import SwiftUI
import MapKit

class FireIncidentsViewModel: ObservableObject {
    @Published var fireIncidents: [FireIncident] = []
    @Published var fireStations: [FireStation] = []
    @Published var fireLevels: [FireLevel] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var selectedFire: FireIncident?
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupWebSocketListeners()
        loadData()
    }
    
    func loadData() {
        loadFireIncidents()
        loadFireStations()
        loadFireLevels()
    }
    
    func loadFireIncidents() {
        isLoading = true
        error = nil
        
        print("Загрузка списка пожаров...")
        APIService.shared.getFireIncidents()
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                
                if case .failure(let error) = completion {
                    self?.error = error.description
                    print("Ошибка при загрузке пожаров: \(error.description)")
                }
            }, receiveValue: { [weak self] incidents in
                print("Загружено пожаров: \(incidents.count)")
                self?.fireIncidents = incidents.filter { $0.status != .resolved && $0.status != .cancelled }
                print("Активных пожаров: \(self?.fireIncidents.count ?? 0)")
            })
            .store(in: &cancellables)
    }
    
    func loadFireStations() {
        print("Загрузка списка пожарных частей...")
        APIService.shared.getFireStations()
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.error = error.description
                    print("Ошибка при загрузке пожарных частей: \(error.description)")
                }
            }, receiveValue: { [weak self] stations in
                print("Загружено пожарных частей: \(stations.count)")
                self?.fireStations = stations
            })
            .store(in: &cancellables)
    }
    
    func loadFireLevels() {
        print("Загрузка уровней пожаров...")
        APIService.shared.getFireLevels()
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.error = error.description
                    print("Ошибка при загрузке уровней пожаров: \(error.description)")
                }
            }, receiveValue: { [weak self] levels in
                print("Загружено уровней пожаров: \(levels.count)")
                self?.fireLevels = levels
            })
            .store(in: &cancellables)
    }
    
    func createFireIncident(coordinate: CLLocationCoordinate2D, address: String?, description: String?, fireLevelId: Int) {
        isLoading = true
        error = nil
        
        APIService.shared.createFireIncident(
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            address: address,
            description: description,
            fireLevelId: fireLevelId
        )
        .receive(on: DispatchQueue.main)
        .sink(receiveCompletion: { [weak self] completion in
            self?.isLoading = false
            
            if case .failure(let error) = completion {
                self?.error = error.description
            }
        }, receiveValue: { [weak self] incident in
            // Новый пожар будет добавлен через WebSocket
            self?.selectedFire = incident
        })
        .store(in: &cancellables)
    }
    
    func changeFireLevel(fire: FireIncident, fireLevelId: Int) {
        isLoading = true
        error = nil
        
        APIService.shared.changeFireLevel(fireId: fire.id, fireLevelId: fireLevelId)
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                
                if case .failure(let error) = completion {
                    self?.error = error.description
                }
            }, receiveValue: { _ in
                // Обновление придет через WebSocket
            })
            .store(in: &cancellables)
    }
    
    func changeFireStatus(fire: FireIncident, status: IncidentStatus) {
        isLoading = true
        error = nil
        
        APIService.shared.changeFireStatus(fireId: fire.id, status: status)
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                
                if case .failure(let error) = completion {
                    self?.error = error.description
                }
            }, receiveValue: { _ in
                // Обновление придет через WebSocket
            })
            .store(in: &cancellables)
    }
    
    // MARK: - WebSocket Listeners
    
    private func setupWebSocketListeners() {
        WebSocketService.shared.websocketEvents
            .receive(on: DispatchQueue.main)
            .sink { [weak self] event in
                switch event {
                case .newFire(let fire):
                    self?.handleNewFire(fire)
                case .fireUpdated(let fire), .fireStatusChanged(let fire), .fireLevelChanged(let fire):
                    self?.handleFireUpdated(fire)
                }
            }
            .store(in: &cancellables)
    }
    
    private func handleNewFire(_ fire: FireIncident) {
        // Проверяем, что пожар не в завершенном статусе
        if fire.status != .resolved && fire.status != .cancelled {
            // Если пожара еще нет в списке, добавляем его
            if !fireIncidents.contains(where: { $0.id == fire.id }) {
                fireIncidents.append(fire)
                
                // Если это первый пожар, делаем его выбранным
                if fireIncidents.count == 1 {
                    selectedFire = fire
                }
                
                // Отправляем уведомление
                sendFireNotification(fire, isNew: true)
            }
        }
    }
    
    private func handleFireUpdated(_ fire: FireIncident) {
        // Если пожар в завершенном статусе, удаляем его из списка
        if fire.status == .resolved || fire.status == .cancelled {
            fireIncidents.removeAll { $0.id == fire.id }
            
            // Если удаленный пожар был выбранным, сбрасываем выбор
            if selectedFire?.id == fire.id {
                selectedFire = fireIncidents.first
            }
        } else {
            // Обновляем пожар в списке
            if let index = fireIncidents.firstIndex(where: { $0.id == fire.id }) {
                fireIncidents[index] = fire
                
                // Обновляем выбранный пожар, если это он
                if selectedFire?.id == fire.id {
                    selectedFire = fire
                }
                
                // Отправляем уведомление об обновлении
                sendFireNotification(fire, isNew: false)
            } else {
                // Если пожара еще нет в списке, добавляем его
                fireIncidents.append(fire)
                
                // Отправляем уведомление
                sendFireNotification(fire, isNew: true)
            }
        }
    }
    
    private func sendFireNotification(_ fire: FireIncident, isNew: Bool) {
        let notification = UNMutableNotificationContent()
        if isNew {
            notification.title = "Новый пожар"
            notification.body = "Адрес: \(fire.address ?? "Неизвестен")"
        } else {
            notification.title = "Пожар обновлен"
            notification.body = "Адрес: \(fire.address ?? "Неизвестен"), Статус: \(fire.status.displayName)"
        }
        notification.sound = UNNotificationSound.default
        
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: notification, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
} 