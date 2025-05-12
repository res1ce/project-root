import SwiftUI

struct AdminView: View {
    @ObservedObject var viewModel: AdminViewModel
    @ObservedObject var fireViewModel: FireIncidentsViewModel
    
    @State private var isAddingUser = false
    @State private var username = ""
    @State private var password = ""
    @State private var name = ""
    @State private var selectedRole: UserRole = .stationDispatcher
    @State private var selectedFireStationId: Int?
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Пользователи")) {
                    ForEach(viewModel.users) { user in
                        VStack(alignment: .leading) {
                            Text(user.username)
                                .font(.headline)
                            Text(user.role.displayName)
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            if let fireStationId = user.fireStationId {
                                if let station = fireViewModel.fireStations.first(where: { $0.id == fireStationId }) {
                                    Text("Пожарная часть: \(station.name)")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                    }
                    
                    Button("Добавить пользователя") {
                        isAddingUser = true
                    }
                }
            }
            .navigationTitle("Администрирование")
            .onAppear {
                viewModel.loadUsers()
                fireViewModel.loadFireStations()
                fireViewModel.loadFireLevels()
            }
            .refreshable {
                viewModel.loadUsers()
                fireViewModel.loadFireStations()
            }
            .sheet(isPresented: $isAddingUser) {
                NavigationView {
                    Form {
                        Section(header: Text("Информация о пользователе")) {
                            TextField("Имя пользователя", text: $username)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                            
                            SecureField("Пароль", text: $password)
                            
                            TextField("Имя", text: $name)
                            
                            Picker("Роль", selection: $selectedRole) {
                                Text("Администратор").tag(UserRole.admin)
                                Text("Центральный диспетчер").tag(UserRole.centralDispatcher)
                                Text("Диспетчер пожарной части").tag(UserRole.stationDispatcher)
                            }
                            
                            if selectedRole == .stationDispatcher {
                                Picker("Пожарная часть", selection: $selectedFireStationId) {
                                    Text("Выберите часть").tag(nil as Int?)
                                    ForEach(fireViewModel.fireStations) { station in
                                        Text(station.name).tag(station.id as Int?)
                                    }
                                }
                            }
                        }
                        
                        Section {
                            Button("Сохранить") {
                                viewModel.createUser(
                                    username: username,
                                    password: password,
                                    role: selectedRole,
                                    name: name,
                                    fireStationId: selectedRole == .stationDispatcher ? selectedFireStationId : nil
                                )
                                isAddingUser = false
                                resetForm()
                            }
                            .disabled(username.isEmpty || password.isEmpty || name.isEmpty || (selectedRole == .stationDispatcher && selectedFireStationId == nil))
                        }
                    }
                    .navigationTitle("Новый пользователь")
                    .navigationBarItems(trailing: Button("Отмена") {
                        isAddingUser = false
                        resetForm()
                    })
                }
            }
            .overlay(
                Group {
                    if viewModel.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .scaleEffect(1.5)
                    }
                }
            )
        }
    }
    
    private func resetForm() {
        username = ""
        password = ""
        name = ""
        selectedRole = .stationDispatcher
        selectedFireStationId = nil
    }
} 