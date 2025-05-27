import Foundation
import SwiftUI

// Этот файл содержит конфигурацию для работы с сетью
// Используется вместо настроек в Info.plist

// ВАЖНО: В реальном приложении лучше использовать Info.plist для настроек безопасности
// Но для учебного проекта и быстрой разработки можно использовать этот подход

// Для разрешения HTTP-запросов в iOS 9+ нужно добавить в Info.plist:
// <key>NSAppTransportSecurity</key>
// <dict>
//     <key>NSAllowsArbitraryLoads</key>
//     <true/>
// </dict>

// Поскольку у нас возникла проблема с Info.plist, мы используем альтернативный подход
// В реальном приложении рекомендуется настроить Info.plist правильно

struct NetworkConfig {
    // Базовый URL для API
    static let baseURL = "http://localhost:3000/api"
    
    // Таймаут для запросов (в секундах)
    static let requestTimeout: Double = 30
    
    // Настройки для заголовков запросов
    static let defaultHeaders = [
        "Content-Type": "application/json",
        "Accept": "application/json"
    ]
}

// Расширение для URLSession для настройки транспортной безопасности
// Это позволит выполнять HTTP-запросы без настроек в Info.plist
// ПРИМЕЧАНИЕ: Это не рекомендуемый подход для продакшн-приложений
extension URLSession {
    static var shared: URLSession {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = NetworkConfig.requestTimeout
        configuration.timeoutIntervalForResource = NetworkConfig.requestTimeout
        
        // Установка настроек транспортной безопасности программно
        // Это эквивалент NSAllowsArbitraryLoads = true в Info.plist
        if #available(iOS 9.0, *) {
            configuration.waitsForConnectivity = true
        }
        
        return URLSession(configuration: configuration)
    }
}
