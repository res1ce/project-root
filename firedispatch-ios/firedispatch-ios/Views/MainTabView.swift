import SwiftUI

struct MainTabView: View {
    @ObservedObject var authViewModel: AuthViewModel
    @StateObject var fireViewModel = FireIncidentsViewModel()
    @StateObject var adminViewModel = AdminViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            if let user = authViewModel.user {
                // Карта пожаров
                FireMapView(viewModel: fireViewModel, userRole: user.role)
                    .tabItem {
                        Label("Карта", systemImage: "map")
                    }
                    .tag(0)
                
                // Список пожаров
                FireIncidentsListView(viewModel: fireViewModel, userRole: user.role)
                    .tabItem {
                        Label("Пожары", systemImage: "flame")
                    }
                    .tag(1)
                
                // Административный интерфейс только для администратора
                if user.role == .admin {
                    AdminView(viewModel: adminViewModel, fireViewModel: fireViewModel)
                        .tabItem {
                            Label("Админ", systemImage: "person.badge.key")
                        }
                        .tag(2)
                }
                
                // Профиль
                ProfileView(authViewModel: authViewModel)
                    .tabItem {
                        Label("Профиль", systemImage: "person")
                    }
                    .tag(3)
            }
        }
        .accentColor(.red)
        .onAppear {
            // Установить WebSocket соединение и параметры авторизации
            setupWebSocketConnection()
            
            // Загрузить данные
            fireViewModel.loadData()
        }
        .onChange(of: selectedTab, { oldValue, newValue in
            // При изменении вкладки проверяем соединение WebSocket
            ensureWebSocketConnection()
        })
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)) { _ in
            // При возврате в приложение
            ensureWebSocketConnection()
            fireViewModel.loadData()
        }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.willResignActiveNotification)) { _ in
            // При выходе из приложения временно отключаем соединение
            WebSocketService.shared.disconnect()
        }
    }
    
    private func setupWebSocketConnection() {
        guard let token = authViewModel.token, let user = authViewModel.user else {
            return
        }
        
        WebSocketService.shared.setToken(token)
        WebSocketService.shared.setUser(user)
        WebSocketService.shared.connect()
    }
    
    private func ensureWebSocketConnection() {
        if authViewModel.isAuthenticated {
            setupWebSocketConnection()
        }
    }
}

struct ProfileView: View {
    @ObservedObject var authViewModel: AuthViewModel
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "person.circle")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 100, height: 100)
                    .foregroundColor(.gray)
                    .padding(.top, 30)
                
                if let user = authViewModel.user {
                    VStack(spacing: 8) {
                        Text(user.name ?? user.username)
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text(user.role.displayName)
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        
                        if let fireStationId = user.fireStationId {
                            Text("ID пожарной части: \(fireStationId)")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    .padding(.bottom, 30)
                }
                
                Button(action: {
                    // Отключаем WebSocket перед выходом
                    WebSocketService.shared.disconnect()
                    authViewModel.logout()
                }) {
                    Text("Выйти")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.red)
                        .cornerRadius(10)
                }
                .padding(.horizontal, 30)
                
                Spacer()
            }
            .navigationTitle("Профиль")
        }
    }
} 