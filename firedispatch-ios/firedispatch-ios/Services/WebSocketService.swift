import Foundation
import Combine
import UserNotifications

enum WSEvent {
    case newFire(FireIncident)
    case fireUpdated(FireIncident)
    case fireStatusChanged(FireIncident)
    case fireLevelChanged(FireIncident)
}

class WebSocketService: NSObject, URLSessionWebSocketDelegate {
    static let shared = WebSocketService()
    
    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession?
    private var isConnected = false
    private var reconnectTimer: Timer?
    private var token: String?
    private var currentUser: User?
    private var pingTimer: Timer?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5
    
    private let websocketEventSubject = PassthroughSubject<WSEvent, Never>()
    var websocketEvents: AnyPublisher<WSEvent, Never> {
        return websocketEventSubject.eraseToAnyPublisher()
    }
    
    private override init() {
        super.init()
        session = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue())
    }
    
    func setToken(_ token: String) {
        self.token = token
    }
    
    func setUser(_ user: User) {
        self.currentUser = user
    }
    
    func connect() {
        guard let token = token else {
            print("WebSocket: No token provided")
            return
        }
        
        guard !isConnected else { return }
        
        // Используем пути совместимые с Socket.io (Socket v4)
        // Фронтенд использует socket.io-client, который автоматически добавляет эти форматы
        // Но тут нам нужно делать это вручную
        let baseUrl = APIService.shared.getWSURL()
        
        // Формат URL для WebSocket Socket.io: http://domain/fire-events/socket.io/?EIO=4&transport=websocket&token={token}
        var urlString = "\(baseUrl)/fire-events/socket.io/"
        urlString += "?EIO=4&transport=websocket"
        urlString += "&token=\(token)"
        
        print("WebSocket connecting to: \(urlString)")
        guard let url = URL(string: urlString) else {
            print("WebSocket: Invalid URL \(urlString)")
            return
        }
        
        var request = URLRequest(url: url)
        request.timeoutInterval = 30
        
        webSocket = session?.webSocketTask(with: request)
        webSocket?.resume()
        
        receiveMessage()
        
        // Не устанавливаем isConnected = true сразу, ждем открытия соединения через делегат
        // isConnected = true
        
        // Стоп таймер если он запущен
        reconnectTimer?.invalidate()
        
        // Устанавливаем ping для поддержания соединения
        startPingTimer()
    }
    
    private func sendAuthenticationData() {
        guard let user = self.currentUser else { return }
        
        // Socket.io ожидает сообщения в специальном формате
        let authMessage = [
            "event": "authenticate",
            "data": [
                "userId": user.id,
                "role": user.role.rawValue
            ]
        ] as [String: Any]
        
        if let jsonData = try? JSONSerialization.data(withJSONObject: authMessage) {
            let jsonString = String(data: jsonData, encoding: .utf8)!
            sendMessage(jsonString)
            
            // Если это диспетчер пожарной части, отправляем команду присоединения к комнате станции
            if user.role == .stationDispatcher, let stationId = user.fireStationId {
                let joinStationMessage = [
                    "event": "join_station",
                    "data": stationId
                ] as [String: Any]
                
                if let jsonData = try? JSONSerialization.data(withJSONObject: joinStationMessage) {
                    let jsonString = String(data: jsonData, encoding: .utf8)!
                    sendMessage(jsonString)
                }
            }
        }
    }
    
    func disconnect() {
        webSocket?.cancel(with: .normalClosure, reason: nil)
        isConnected = false
        pingTimer?.invalidate()
        reconnectTimer?.invalidate()
        reconnectAttempts = 0
    }
    
    private func sendMessage(_ message: String) {
        let message = URLSessionWebSocketTask.Message.string(message)
        webSocket?.send(message) { [weak self] error in
            if let error = error {
                print("WebSocket send error: \(error)")
                if self?.isConnected == true {
                    self?.handleDisconnect(reason: "Send error: \(error.localizedDescription)")
                }
            }
        }
    }
    
    private func startPingTimer() {
        // Останавливаем текущий таймер если он есть
        pingTimer?.invalidate()
        
        // Создаем таймер для отправки ping каждые 20 секунд (как на фронтенде)
        pingTimer = Timer.scheduledTimer(withTimeInterval: 20, repeats: true) { [weak self] _ in
            guard let self = self, self.isConnected else { return }
            
            // Формат ping для socket.io: просто строка "2"
            self.sendMessage("2")
        }
    }
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                switch message {
                case .data(let data):
                    self.handleMessage(data: data)
                case .string(let string):
                    // Обработка сервисных сообщений Socket.IO
                    if string.hasPrefix("0") {
                        // Это инициализационное сообщение socket.io
                        print("Socket.IO контрольное сообщение: \(string)")
                        // После получения открывающего сообщения отправляем аутентификацию
                        self.sendAuthenticationData()
                    } else if string.hasPrefix("2") {
                        // Это ping от сервера, отправляем pong (3)
                        print("Socket.IO ping, отправляем pong")
                        self.sendMessage("3")
                    } else if string.hasPrefix("3") {
                        // Это pong от сервера
                        print("Socket.IO pong получен")
                    } else if string.hasPrefix("4") {
                        // Это сообщение от сервера (возможно JSON)
                        if string.count > 1 {
                            let jsonStart = string.index(string.startIndex, offsetBy: 1)
                            let jsonString = String(string[jsonStart...])
                            if let data = jsonString.data(using: .utf8) {
                                self.handleMessage(data: data)
                            }
                        }
                    } else if let data = string.data(using: .utf8) {
                        // Пытаемся обработать как JSON только если это не сервисное сообщение Socket.IO
                        self.handleMessage(data: data)
                    }
                @unknown default:
                    break
                }
                
                // Сбрасываем счетчик попыток переподключения при успешном получении сообщения
                self.reconnectAttempts = 0
                
                // Продолжаем прослушивание сообщений
                self.receiveMessage()
                
            case .failure(let error):
                print("WebSocket Error: \(error)")
                self.handleDisconnect(reason: error.localizedDescription)
            }
        }
    }
    
    private func handleDisconnect(reason: String) {
        isConnected = false
        pingTimer?.invalidate()
        
        print("WebSocket disconnected: \(reason)")
        
        // Планируем переподключение, только если не превышен лимит попыток
        if reconnectAttempts < maxReconnectAttempts {
            scheduleReconnect()
        } else {
            print("Превышено максимальное количество попыток переподключения")
        }
    }
    
    private func handleMessage(data: Data) {
        do {
            // Проверяем, является ли сообщение корректным JSON
            guard let _ = try? JSONSerialization.jsonObject(with: data) else {
                print("Получено не-JSON сообщение: \(String(data: data, encoding: .utf8) ?? "неизвестно")")
                return
            }
            
            // Попытаемся понять тип сообщения
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let event = json["event"] as? String {
                
                // Декодер для дат
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                
                print("Получено WebSocket событие: \(event)")
                
                switch event {
                case "fire.created":
                    if let fireData = json["data"] as? [String: Any],
                       let fireJson = try? JSONSerialization.data(withJSONObject: fireData) {
                        let fire = try decoder.decode(FireIncident.self, from: fireJson)
                        websocketEventSubject.send(.newFire(fire))
                    }
                    
                case "fire.updated":
                    if let fireData = json["data"] as? [String: Any],
                       let fireJson = try? JSONSerialization.data(withJSONObject: fireData) {
                        let fire = try decoder.decode(FireIncident.self, from: fireJson)
                        websocketEventSubject.send(.fireUpdated(fire))
                    }
                    
                case "fire.status.changed":
                    if let fireData = json["data"] as? [String: Any],
                       let fireJson = try? JSONSerialization.data(withJSONObject: fireData) {
                        let fire = try decoder.decode(FireIncident.self, from: fireJson)
                        websocketEventSubject.send(.fireStatusChanged(fire))
                    }
                    
                case "fire.level.changed":
                    if let fireData = json["data"] as? [String: Any],
                       let fireJson = try? JSONSerialization.data(withJSONObject: fireData) {
                        let fire = try decoder.decode(FireIncident.self, from: fireJson)
                        websocketEventSubject.send(.fireLevelChanged(fire))
                    }
                
                case "pong":
                    print("Получен pong от сервера")
                    
                case "server_keepalive":
                    // Отвечаем на keepalive сообщение
                    let aliveMessage = ["event": "client_alive", "data": ["timestamp": Date().timeIntervalSince1970]] as [String: Any]
                    if let jsonData = try? JSONSerialization.data(withJSONObject: aliveMessage) {
                        let jsonString = String(data: jsonData, encoding: .utf8)!
                        sendMessage(jsonString)
                    }
                    
                default:
                    print("Unknown event: \(event)")
                }
            }
        } catch {
            print("Failed to decode websocket message: \(error)")
        }
    }
    
    private func scheduleReconnect() {
        reconnectTimer?.invalidate()
        
        // Увеличиваем счетчик попыток
        reconnectAttempts += 1
        
        // Экспоненциальная задержка, как во фронтенде
        let delay = min(2.0 * pow(1.5, Double(reconnectAttempts)), 30.0)
        
        print("Scheduling WebSocket reconnect in \(delay)s (attempt \(reconnectAttempts))")
        
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
            self?.connect()
        }
    }
    
    // MARK: - URLSessionWebSocketDelegate
    
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        isConnected = true
        reconnectAttempts = 0
        print("WebSocket connected")
        
        // Запускаем ping после подключения
        startPingTimer()
        
        // Отправляем аутентификационные данные после того, как соединение установлено
        if let user = self.currentUser {
            // Даем немного времени для обмена начальными сообщениями socket.io
            Timer.scheduledTimer(withTimeInterval: 1.0, repeats: false) { [weak self] _ in
                self?.sendAuthenticationData()
            }
        }
    }
    
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        var reasonString = "Unknown"
        if let reason = reason, let reasonText = String(data: reason, encoding: .utf8) {
            reasonString = reasonText
        }
        
        handleDisconnect(reason: "WebSocket closed with code: \(closeCode.rawValue), reason: \(reasonString)")
    }
} 