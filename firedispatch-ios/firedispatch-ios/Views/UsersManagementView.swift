import SwiftUI
import Combine

struct UsersManagementView: View {
    @State private var users: [User] = []
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    @State private var showAddUserSheet = false
    @State private var selectedUser: User? = nil
    @State private var showDeleteAlert = false
    
    private var userService = UserService.shared
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        VStack {
            // Заголовок и кнопка добавления
            HStack {
                Text("Управление пользователями")
                    .font(.headline)
                
                Spacer()
                
                Button(action: {
                    showAddUserSheet = true
                }) {
                    Image(systemName: "plus")
                        .foregroundColor(.white)
                        .padding(8)
                        .background(Color.blue)
                        .clipShape(Circle())
                }
            }
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
            } else if users.isEmpty {
                Text("Нет пользователей")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                // Список пользователей
                List {
                    ForEach(users) { user in
                        UserRow(user: user)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedUser = user
                            }
                            .swipeActions {
                                Button(role: .destructive) {
                                    selectedUser = user
                                    showDeleteAlert = true
                                } label: {
                                    Label("Удалить", systemImage: "trash")
                                }
                            }
                    }
                }
                .listStyle(InsetGroupedListStyle())
            }
        }
        .onAppear {
            loadUsers()
        }
        .refreshable {
            loadUsers()
        }
        .sheet(isPresented: $showAddUserSheet) {
            AddUserView(onComplete: { success in
                if success {
                    loadUsers()
                }
            })
        }
        .sheet(item: $selectedUser) { user in
            UserDetailView(user: user, onComplete: { success in
                print("\n\n===== Закрытие формы редактирования пользователя =====")
                print("Успешно: \(success)")
                print("===========================================\n\n")
                
                // Сбрасываем выбранного пользователя и перезагружаем список
                selectedUser = nil
                
                if success {
                    // Добавляем небольшую задержку перед обновлением, чтобы дать серверу время обработать запрос
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        loadUsers()
                    }
                }
            })
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Удаление пользователя"),
                message: Text("Вы уверены, что хотите удалить пользователя \(selectedUser?.username ?? "")?"),
                primaryButton: .destructive(Text("Удалить")) {
                    if let user = selectedUser {
                        deleteUser(id: user.id)
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
    
    private func loadUsers() {
        isLoading = true
        errorMessage = nil
        
        print("\n\n===== Загрузка списка пользователей =====")
        
        userService.getAllUsers()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    
                    if case .failure(let error) = completion {
                        errorMessage = error.message
                        print("Ошибка при загрузке пользователей: \(error.message)")
                    } else {
                        print("Загрузка пользователей завершена успешно")
                    }
                },
                receiveValue: { users in
                    self.users = users
                    isLoading = false
                    
                    print("Загружено пользователей: \(users.count)")
                    for (index, user) in users.enumerated() {
                        print("\(index + 1). ID: \(user.id), Имя пользователя: \(user.username), Имя: \(user.name as Any), Роль: \(user.role.rawValue)")
                    }
                    print("===========================================\n\n")
                }
            )
            .store(in: &cancellables)
    }
    
    private func deleteUser(id: Int) {
        isLoading = true
        
        // Здесь должен быть запрос на удаление пользователя
        // Для примера используем имитацию запроса
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            // После успешного удаления обновляем список
            self.loadUsers()
        }
    }
}

struct UserRow: View {
    let user: User
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(user.name ?? user.username)
                    .font(.headline)
                
                Text(user.username)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(user.role.displayName)
                    .font(.caption)
                    .padding(5)
                    .background(roleColor(user.role).opacity(0.2))
                    .foregroundColor(roleColor(user.role))
                    .cornerRadius(5)
                
                if let stationId = user.fireStationId {
                    Text("Часть №\(stationId)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 5)
    }
    
    private func roleColor(_ role: UserRole) -> Color {
        switch role {
        case .admin:
            return .red
        case .central_dispatcher:
            return .blue
        case .station_dispatcher:
            return .green
        }
    }
}

struct AddUserView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var username: String = ""
    @State private var password: String = ""
    @State private var name: String = ""
    @State private var selectedRole: UserRole = .station_dispatcher
    @State private var fireStationId: String = ""
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    private var userService = UserService.shared
    @State private var cancellables = Set<AnyCancellable>()
    
    var onComplete: (Bool) -> Void
    
    // Добавляем явный инициализатор
    init(onComplete: @escaping (Bool) -> Void) {
        self.onComplete = onComplete
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Основная информация")) {
                    TextField("Имя пользователя", text: $username)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    
                    SecureField("Пароль", text: $password)
                    
                    TextField("Имя (опционально)", text: $name)
                }
                
                Section(header: Text("Роль")) {
                    Picker("Роль пользователя", selection: $selectedRole) {
                        Text("Администратор").tag(UserRole.admin)
                        Text("Центральный диспетчер").tag(UserRole.central_dispatcher)
                        Text("Диспетчер пожарной части").tag(UserRole.station_dispatcher)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                
                if selectedRole == .station_dispatcher {
                    Section(header: Text("Пожарная часть")) {
                        TextField("ID пожарной части", text: $fireStationId)
                            .keyboardType(.numberPad)
                    }
                }
                
                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                    }
                }
                
                Section {
                    Button(action: createUser) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle())
                                .frame(maxWidth: .infinity, alignment: .center)
                        } else {
                            Text("Создать пользователя")
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                    .disabled(username.isEmpty || password.isEmpty || isLoading)
                }
            }
            .navigationTitle("Новый пользователь")
            .navigationBarItems(
                trailing: Button("Отмена") {
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
    }
    
    private func createUser() {
        isLoading = true
        errorMessage = nil
        
        let stationId = Int(fireStationId)
        
        userService.createUser(
            username: username,
            password: password,
            role: selectedRole,
            name: name.isEmpty ? nil : name,
            fireStationId: selectedRole == .station_dispatcher ? stationId : nil
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completion in
                isLoading = false
                
                if case .failure(let error) = completion {
                    errorMessage = error.message
                    onComplete(false)
                }
            },
            receiveValue: { _ in
                isLoading = false
                presentationMode.wrappedValue.dismiss()
                onComplete(true)
            }
        )
        .store(in: &cancellables)
    }
}

struct UserDetailView: View {
    @Environment(\.presentationMode) var presentationMode
    let user: User
    var onComplete: (Bool) -> Void
    
    @State private var isEditing = false
    @State private var editName: String = ""
    @State private var editRole: UserRole = .station_dispatcher
    @State private var editFireStationId: String = ""
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    private var userService = UserService.shared
    @State private var cancellables = Set<AnyCancellable>()
    
    init(user: User, onComplete: @escaping (Bool) -> Void) {
        self.user = user
        self.onComplete = onComplete
        _editName = State(initialValue: user.name ?? "")
        _editRole = State(initialValue: user.role)
        _editFireStationId = State(initialValue: user.fireStationId != nil ? "\(user.fireStationId!)" : "")
    }
    
    var body: some View {
        NavigationView {
            Form {
                if !isEditing {
                    // Режим просмотра
                    Section(header: Text("Информация о пользователе")) {
                        HStack {
                            Text("ID")
                            Spacer()
                            Text("\(user.id)")
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Имя пользователя")
                            Spacer()
                            Text(user.username)
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Имя")
                            Spacer()
                            Text(user.name ?? "Не указано")
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Роль")
                            Spacer()
                            Text(user.role.displayName)
                                .foregroundColor(.secondary)
                        }
                        
                        if let stationId = user.fireStationId {
                            HStack {
                                Text("Пожарная часть")
                                Spacer()
                                Text("№\(stationId)")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    // Здесь можно добавить секцию с активностью пользователя
                    Section(header: Text("Действия")) {
                        Button(action: {
                            isEditing = true
                        }) {
                            Label("Редактировать", systemImage: "pencil")
                        }
                        
                        Button(action: {
                            // Здесь должна быть логика сброса пароля
                        }) {
                            Label("Сбросить пароль", systemImage: "key")
                        }
                    }
                } else {
                    // Режим редактирования
                    Section(header: Text("Редактирование пользователя")) {
                        HStack {
                            Text("Имя пользователя")
                            Spacer()
                            Text(user.username)
                                .foregroundColor(.secondary)
                        }
                        
                        TextField("Имя", text: $editName)
                        
                        Picker("Роль", selection: $editRole) {
                            Text("Администратор").tag(UserRole.admin)
                            Text("Центральный диспетчер").tag(UserRole.central_dispatcher)
                            Text("Диспетчер пожарной части").tag(UserRole.station_dispatcher)
                        }
                        .pickerStyle(SegmentedPickerStyle())
                        
                        if editRole == .station_dispatcher {
                            TextField("ID пожарной части", text: $editFireStationId)
                                .keyboardType(.numberPad)
                        }
                    }
                    
                    if let errorMessage = errorMessage {
                        Section {
                            Text(errorMessage)
                                .foregroundColor(.red)
                        }
                    }
                    
                    Section {
                        Button(action: updateUser) {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle())
                                    .frame(maxWidth: .infinity, alignment: .center)
                            } else {
                                Text("Сохранить изменения")
                                    .frame(maxWidth: .infinity, alignment: .center)
                            }
                        }
                        .disabled(isLoading)
                        
                        Button(action: {
                            isEditing = false
                            // Восстанавливаем исходные значения
                            editName = user.name ?? ""
                            editRole = user.role
                            editFireStationId = user.fireStationId != nil ? "\(user.fireStationId!)" : ""
                            errorMessage = nil
                        }) {
                            Text("Отменить")
                                .foregroundColor(.red)
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                        .disabled(isLoading)
                    }
                }
            }
            .navigationTitle(isEditing ? "Редактирование" : "Пользователь")
            .navigationBarItems(
                trailing: Button(isEditing ? "Отмена" : "Закрыть") {
                    if isEditing {
                        isEditing = false
                        // Восстанавливаем исходные значения
                        editName = user.name ?? ""
                        editRole = user.role
                        editFireStationId = user.fireStationId != nil ? "\(user.fireStationId!)" : ""
                        errorMessage = nil
                    } else {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            )
        }
    }
    
    private func updateUser() {
        isLoading = true
        errorMessage = nil
        
        // Преобразуем ID пожарной части в Int, если указан
        let fireStationId: Int? = editRole == .station_dispatcher ? Int(editFireStationId) : nil
        
        // Добавляем логирование для отладки
        print("\n\n===== Отправляем запрос на обновление пользователя =====")
        print("ID пользователя: \(user.id)")
        print("Имя: \(editName)")
        print("Роль: \(editRole.rawValue)")
        print("ID пожарной части: \(fireStationId as Any)")
        print("===========================================\n\n")
        
        // Используем реальный API-запрос для обновления пользователя
        userService.updateUser(
            id: user.id,
            name: editName.isEmpty ? nil : editName,
            role: editRole,
            fireStationId: fireStationId
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completion in
                isLoading = false
                
                if case .failure(let error) = completion {
                    errorMessage = error.message
                    print("\n\n===== Ошибка при обновлении пользователя =====")
                    print(error.message)
                    print("===========================================\n\n")
                }
            },
            receiveValue: { updatedUser in
                isLoading = false
                isEditing = false
                
                // Добавляем логирование ответа
                print("\n\n===== Получен ответ от сервера =====")
                print("ID пользователя: \(updatedUser.id)")
                print("Имя пользователя: \(updatedUser.username)")
                print("Имя: \(updatedUser.name as Any)")
                print("Роль: \(updatedUser.role.rawValue)")
                print("ID пожарной части: \(updatedUser.fireStationId as Any)")
                print("===========================================\n\n")
                
                onComplete(true)
                presentationMode.wrappedValue.dismiss()
            }
        )
        .store(in: &cancellables)
    }
}
