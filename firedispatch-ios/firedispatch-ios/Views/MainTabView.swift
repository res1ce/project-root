import SwiftUI

struct MainTabView: View {
    @ObservedObject var authViewModel: AuthViewModel
    @StateObject var fireViewModel = FireIncidentsViewModel()
    @StateObject var adminViewModel = AdminViewModel()
    
    var body: some View {
        TabView {
            if let user = authViewModel.user {
                // Карта пожаров
                FireMapView(viewModel: fireViewModel, userRole: user.role)
                    .tabItem {
                        Label("Карта", systemImage: "map")
                    }
                
                // Список пожаров
                FireIncidentsListView(viewModel: fireViewModel, userRole: user.role)
                    .tabItem {
                        Label("Пожары", systemImage: "flame")
                    }
                
                // Административный интерфейс только для администратора
                if user.role == .admin {
                    AdminView(viewModel: adminViewModel, fireViewModel: fireViewModel)
                        .tabItem {
                            Label("Админ", systemImage: "person.badge.key")
                        }
                }
                
                // Профиль
                ProfileView(authViewModel: authViewModel)
                    .tabItem {
                        Label("Профиль", systemImage: "person")
                    }
            }
        }
        .accentColor(.red)
        .onAppear {
            fireViewModel.loadData()
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