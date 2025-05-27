import Foundation

struct FireStation: Codable, Identifiable {
    let id: Int
    let name: String
    let address: String
    let latitude: Double
    let longitude: Double
    let phoneNumber: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case address
        case latitude
        case longitude
        case phoneNumber
    }
}

struct CreateFireStationRequest: Codable {
    let name: String
    let address: String
    let latitude: Double
    let longitude: Double
    let phoneNumber: String?
}
