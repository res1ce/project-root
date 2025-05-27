import SwiftUI
import Combine

struct AdminDashboardView: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedTab = 0
    @State private var showLogoutAlert = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Главная панель
            DashboardHomeView()
                .tabItem {
                    Label("Главная", systemImage: "house.fill")
                }
                .tag(0)
            
            // Управление пользователями
            UsersManagementView()
                .tabItem {
                    Label("Пользователи", systemImage: "person.2.fill")
                }
                .tag(1)
            
            // Управление пожарными частями
            FireStationsView()
                .tabItem {
                    Label("Пожарные части", systemImage: "building.2.fill")
                }
                .tag(2)
            
            // Системные настройки
            SystemSettingsView()
                .tabItem {
                    Label("Настройки", systemImage: "gear")
                }
                .tag(3)
        }
        .navigationBarTitle(getTitle(), displayMode: .inline)
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(
            leading: Text("МЧС Диспетчер")
                .font(.headline)
                .foregroundColor(.blue),
            trailing: HStack {
                if let user = appState.currentUser {
                    Menu {
                        Text("Пользователь: \(user.username)")
                        Text("Роль: \(user.role.displayName)")
                        Divider()
                        Button(action: {
                            showLogoutAlert = true
                        }) {
                            Label("Выйти", systemImage: "arrow.right.square")
                        }
                    } label: {
                        HStack {
                            Text(user.name ?? user.username)
                                .font(.subheadline)
                            Image(systemName: "person.crop.circle")
                                .imageScale(.large)
                        }
                    }
                }
            }
        )
        .alert(isPresented: $showLogoutAlert) {
            Alert(
                title: Text("Выход из системы"),
                message: Text("Вы уверены, что хотите выйти?"),
                primaryButton: .destructive(Text("Выйти")) {
                    logout()
                },
                secondaryButton: .cancel(Text("Отмена"))
            )
        }
    }
    
    private func getTitle() -> String {
        switch selectedTab {
        case 0:
            return "Панель управления"
        case 1:
            return "Управление пользователями"
        case 2:
            return "Пожарные части"
        case 3:
            return "Системные настройки"
        default:
            return "МЧС Диспетчер"
        }
    }
    
    private func logout() {
        appState.logout()
    }
}

struct DashboardHomeView: View {
    @State private var stats: ActivityStats?
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    private var userService = UserService.shared
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Панель управления")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.horizontal)
                
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                } else if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .padding()
                } else if let stats = stats {
                    // Статистика
                    statsView(stats: stats)
                } else {
                    Text("Нет данных")
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                }
            }
            .padding(.vertical)
        }
        .onAppear {
            loadStats()
        }
        .refreshable {
            loadStats()
        }
    }
    
    private func statsView(stats: ActivityStats) -> some View {
        VStack(spacing: 20) {
            // Карточки с ключевыми показателями
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 15) {
                statCard(title: "Всего пользователей", value: "\(stats.totalUsers)", icon: "person.fill")
                statCard(title: "Активность сегодня", value: "\(stats.activityToday)", icon: "chart.bar.fill")
                statCard(title: "Всего активностей", value: "\(stats.totalActivity)", icon: "list.bullet")
                statCard(title: "Типы активностей", value: "\(stats.stats.count)", icon: "tag.fill")
            }
            .padding(.horizontal)
            
            // Детальная статистика по типам активностей
            VStack(alignment: .leading, spacing: 10) {
                Text("Статистика по типам активностей")
                    .font(.headline)
                    .padding(.horizontal)
                
                ForEach(Array(stats.stats.keys.sorted()), id: \.self) { key in
                    if let value = stats.stats[key] {
                        HStack {
                            Text(formatActivityType(key))
                                .font(.subheadline)
                            
                            Spacer()
                            
                            Text("\(value)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 5)
                        
                        Divider()
                            .padding(.horizontal)
                    }
                }
            }
            .background(Color(.systemGray6))
            .cornerRadius(10)
            .padding(.horizontal)
        }
    }
    
    private func statCard(title: String, value: String, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.blue)
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
    
    private func formatActivityType(_ type: String) -> String {
        switch type {
        case "create_user":
            return "Создание пользователя"
        case "update_user":
            return "Обновление пользователя"
        case "delete_user":
            return "Удаление пользователя"
        case "create_fire_station":
            return "Создание пожарной части"
        case "update_fire_station":
            return "Обновление пожарной части"
        case "delete_fire_station":
            return "Удаление пожарной части"
        case "update_system_settings":
            return "Обновление настроек системы"
        case "create_fire":
            return "Создание пожара"
        case "update_fire":
            return "Обновление пожара"
        case "resolve_fire":
            return "Разрешение пожара"
        default:
            return type.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
    
    private func loadStats() {
        isLoading = true
        errorMessage = nil
        
        userService.getActivityStats()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    
                    if case .failure(let error) = completion {
                        errorMessage = error.message
                    }
                },
                receiveValue: { stats in
                    self.stats = stats
                    isLoading = false
                }
            )
            .store(in: &cancellables)
    }
}
