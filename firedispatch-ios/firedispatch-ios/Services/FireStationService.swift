import Foundation
import Combine

class FireStationService {
    static let shared = FireStationService()
    
    private let apiService = APIService.shared
    
    private init() {}
    
    func getAllFireStations() -> AnyPublisher<[FireStation], APIError> {
        return apiService.request<[FireStation]>(endpoint: "fire-station", method: "GET")
            .eraseToAnyPublisher()
    }
    
    func getFireStationById(id: Int) -> AnyPublisher<FireStation, APIError> {
        return apiService.request<FireStation>(endpoint: "fire-station/\(id)", method: "GET")
            .eraseToAnyPublisher()
    }
    
    func createFireStation(name: String, address: String, latitude: Double, longitude: Double, phoneNumber: String? = nil) -> AnyPublisher<FireStation, APIError> {
        let request = CreateFireStationRequest(
            name: name,
            address: address,
            latitude: latitude,
            longitude: longitude,
            phoneNumber: phoneNumber
        )
        
        return apiService.request(endpoint: "fire-station", method: "POST", body: request)
            .eraseToAnyPublisher()
    }
    
    func updateFireStation(id: Int, name: String, address: String, latitude: Double, longitude: Double, phoneNumber: String? = nil) -> AnyPublisher<FireStation, APIError> {
        let request = CreateFireStationRequest(
            name: name,
            address: address,
            latitude: latitude,
            longitude: longitude,
            phoneNumber: phoneNumber
        )
        
        return apiService.request(endpoint: "fire-station/\(id)", method: "PUT", body: request)
            .eraseToAnyPublisher()
    }
    
    func deleteFireStation(id: Int) -> AnyPublisher<FireStation, APIError> {
        return apiService.request<FireStation>(endpoint: "fire-station/\(id)", method: "DELETE")
            .eraseToAnyPublisher()
    }
}
