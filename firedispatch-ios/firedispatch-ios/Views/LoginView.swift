import SwiftUI

struct LoginView: View {
    @ObservedObject var viewModel: AuthViewModel
    
    @State private var username: String = ""
    @State private var password: String = ""
    @State private var showPassword: Bool = false
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.red.opacity(0.05)
                    .ignoresSafeArea()
                
                VStack(spacing: 20) {
                    Image(systemName: "flame.fill")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 100, height: 100)
                        .foregroundColor(.red)
                        .padding(.bottom, 20)
                    
                    Text("Диспетчерская МЧС")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                    
                    VStack(spacing: 15) {
                        TextField("Имя пользователя", text: $username)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                            )
                            .disableAutocorrection(true)
                            .autocapitalization(.none)
                        
                        HStack {
                            if showPassword {
                                TextField("Пароль", text: $password)
                                    .disableAutocorrection(true)
                                    .autocapitalization(.none)
                            } else {
                                SecureField("Пароль", text: $password)
                                    .disableAutocorrection(true)
                                    .autocapitalization(.none)
                            }
                            
                            Button(action: {
                                showPassword.toggle()
                            }) {
                                Image(systemName: showPassword ? "eye.slash" : "eye")
                                    .foregroundColor(.gray)
                            }
                        }
                        .padding()
                        .background(Color.white)
                        .cornerRadius(10)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                    }
                    .padding(.horizontal, 20)
                    
                    if let error = viewModel.error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding(.top, 5)
                    }
                    
                    Button(action: {
                        viewModel.login(username: username, password: password)
                    }) {
                        HStack {
                            if viewModel.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .padding(.trailing, 5)
                            }
                            
                            Text("Войти")
                                .fontWeight(.bold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(username.isEmpty || password.isEmpty || viewModel.isLoading)
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                }
                .padding(.vertical, 30)
            }
            .navigationBarHidden(true)
        }
        .accentColor(.red)
    }
} 