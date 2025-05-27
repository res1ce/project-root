import Foundation

struct UpdateSystemSettingsRequest: Codable {
    let defaultCityName: String
    let defaultLatitude: Double
    let defaultLongitude: Double
    let defaultZoom: Double
}
