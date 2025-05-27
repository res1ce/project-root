import SwiftUI
import Combine

struct LoginView: View {
    @EnvironmentObject private var appState: AppState
    @State private var username: String = ""
    @State private var password: String = ""
    @State private var isLoading: Bool = false
    @State private var errorMessage: String? = nil
    
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Лого и заголовок
                Image(systemName: "flame.fill")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 80, height: 80)
                    .foregroundColor(.red)
                    .padding(.top, 50)
                
                Text("МЧС Диспетчер")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Панель администратора")
                    .font(.headline)
                    .foregroundColor(.secondary)
                    .padding(.bottom, 30)
                
                // Форма входа
                VStack(spacing: 15) {
                    TextField("Имя пользователя", text: $username)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                        .disableAutocorrection(true)
                        .autocapitalization(.none)
                    
                    SecureField("Пароль", text: $password)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    
                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.footnote)
                            .padding(.top, 5)
                    }
                    
                    Button(action: login) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle())
                        } else {
                            Text("Войти")
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(8)
                        }
                    }
                    .disabled(username.isEmpty || password.isEmpty || isLoading)
                }
                .padding(.horizontal)
                
                Spacer()
                
                // Футер
                Text("© 2025 МЧС Диспетчер")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.bottom)
            }
            .padding()
            .navigationBarHidden(true)
        }
    }
    
    private func login() {
        isLoading = true
        errorMessage = nil
        
        appState.login(username: username, password: password) { result in
            isLoading = false
            
            switch result {
            case .success(_):
                // Авторизация успешна, AppState уже обновлен
                break
            case .failure(let error):
                if error == .unauthorized {
                    errorMessage = "Доступ запрещен. Только администраторы могут войти в приложение."
                } else {
                    errorMessage = error.message
                }
            }
        }
    }
}
