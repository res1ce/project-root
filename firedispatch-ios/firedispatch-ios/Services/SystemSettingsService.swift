import Foundation
import Combine

class SystemSettingsService {
    static let shared = SystemSettingsService()
    
    private let apiService = APIService.shared
    
    private init() {}
    
    func getSystemSettings() -> AnyPublisher<SystemSettings, APIError> {
        return apiService.request<SystemSettings>(endpoint: "system-settings", method: "GET")
            .eraseToAnyPublisher()
    }
    
    func updateSystemSettings(
        defaultCityName: String,
        defaultLatitude: Double,
        defaultLongitude: Double,
        defaultZoom: Double
    ) -> AnyPublisher<SystemSettings, APIError> {
        let request = UpdateSystemSettingsRequest(
            defaultCityName: defaultCityName,
            defaultLatitude: defaultLatitude,
            defaultLongitude: defaultLongitude,
            defaultZoom: defaultZoom
        )
        
        return apiService.request<SystemSettings, UpdateSystemSettingsRequest>(endpoint: "system-settings", method: "PUT", body: request)
            .eraseToAnyPublisher()
    }
}
