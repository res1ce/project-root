import Foundation

struct SystemSettings: Codable, Identifiable {
    let id: Int
    let defaultCityName: String
    let defaultLatitude: Double
    let defaultLongitude: Double
    let defaultZoom: Double
    let updatedAt: String
    let updatedBy: UpdatedBy?
    
    struct UpdatedBy: Codable {
        let id: Int
        let username: String
        let name: String
    }
}
