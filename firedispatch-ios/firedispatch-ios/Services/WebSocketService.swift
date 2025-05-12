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
    private var user: User?
    
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
        self.user = user
    }
    
    func connect() {
        guard let token = token else {
            print("WebSocket: No token provided")
            return
        }
        
        guard !isConnected else { return }
        
        // Используем формат URL с обратным слешем
        let wsPath = "/fire-events"
        let socketIOPath = "/socket.io/?EIO=4&transport=websocket"
        var urlString = "ws://localhost:3000\(wsPath)\(socketIOPath)"
        
        // Добавляем токен
        urlString += "&token=\(token)"
        
        print("WebSocket connecting to: \(urlString)")
        var request = URLRequest(url: URL(string: urlString)!)
        request.timeoutInterval = 30
        
        webSocket = session?.webSocketTask(with: request)
        webSocket?.resume()
        
        receiveMessage()
        isConnected = true
        
        // Отправляем сообщение ping для проверки соединения
        let pingMessage = ["event": "ping", "data": ""] as [String: Any]
        if let jsonData = try? JSONSerialization.data(withJSONObject: pingMessage) {
            let jsonString = String(data: jsonData, encoding: .utf8)!
            sendMessage(jsonString)
        }
        
        // После установки соединения отправляем дополнительные данные для авторизации
        if let user = self.user {
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
        
        // Стоп таймер если он запущен
        reconnectTimer?.invalidate()
        
        // Устанавливаем ping для поддержания соединения
        startPingTimer()
    }
    
    func disconnect() {
        webSocket?.cancel(with: .normalClosure, reason: nil)
        isConnected = false
    }
    
    private func sendMessage(_ message: String) {
        let message = URLSessionWebSocketTask.Message.string(message)
        webSocket?.send(message) { error in
            if let error = error {
                print("WebSocket send error: \(error)")
            }
        }
    }
    
    private func startPingTimer() {
        // Создаем таймер для отправки ping каждые 45 секунд
        Timer.scheduledTimer(withTimeInterval: 45, repeats: true) { [weak self] _ in
            guard let self = self, self.isConnected else { return }
            
            let pingMessage = ["event": "ping", "data": ""] as [String: Any]
            if let jsonData = try? JSONSerialization.data(withJSONObject: pingMessage) {
                let jsonString = String(data: jsonData, encoding: .utf8)!
                self.sendMessage(jsonString)
            }
        }
    }
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .data(let data):
                    self?.handleMessage(data: data)
                case .string(let string):
                    if let data = string.data(using: .utf8) {
                        self?.handleMessage(data: data)
                    }
                @unknown default:
                    break
                }
                
                // Продолжить прослушивание сообщений
                self?.receiveMessage()
                
            case .failure(let error):
                print("WebSocket Error: \(error)")
                self?.isConnected = false
                self?.scheduleReconnect()
            }
        }
    }
    
    private func handleMessage(data: Data) {
        do {
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
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: false) { [weak self] _ in
            self?.connect()
        }
    }
    
    // MARK: - URLSessionWebSocketDelegate
    
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        isConnected = true
        print("WebSocket connected")
    }
    
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        isConnected = false
        
        if let reason = reason, let reasonString = String(data: reason, encoding: .utf8) {
            print("WebSocket closed with reason: \(reasonString)")
        } else {
            print("WebSocket closed")
        }
        
        scheduleReconnect()
    }
} 