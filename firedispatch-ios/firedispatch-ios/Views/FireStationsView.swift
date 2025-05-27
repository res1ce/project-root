import SwiftUI
import Combine

struct FireStationsView: View {
    @State private var fireStations: [FireStation] = []
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    @State private var showAddStationSheet = false
    @State private var selectedStation: FireStation? = nil
    @State private var showDeleteAlert = false
    
    private var fireStationService = FireStationService.shared
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        VStack {
            // Заголовок и кнопка добавления
            HStack {
                Text("Пожарные части")
                    .font(.headline)
                
                Spacer()
                
                Button(action: {
                    showAddStationSheet = true
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
            } else if fireStations.isEmpty {
                Text("Нет пожарных частей")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                // Список пожарных частей
                List {
                    ForEach(fireStations) { station in
                        FireStationRow(station: station)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedStation = station
                            }
                            .swipeActions {
                                Button(role: .destructive) {
                                    selectedStation = station
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
            loadFireStations()
        }
        .refreshable {
            loadFireStations()
        }
        .sheet(isPresented: $showAddStationSheet) {
            AddFireStationView { success in
                if success {
                    loadFireStations()
                }
            }
        }
        .sheet(item: $selectedStation) { station in
            FireStationDetailView(station: station) { success in
                if success {
                    loadFireStations()
                }
            }
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Удаление пожарной части"),
                message: Text("Вы уверены, что хотите удалить пожарную часть \(selectedStation?.name ?? "")?"),
                primaryButton: .destructive(Text("Удалить")) {
                    if let station = selectedStation {
                        deleteFireStation(id: station.id)
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
    
    private func loadFireStations() {
        isLoading = true
        errorMessage = nil
        
        fireStationService.getAllFireStations()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    
                    if case .failure(let error) = completion {
                        errorMessage = error.message
                    }
                },
                receiveValue: { stations in
                    self.fireStations = stations
                    isLoading = false
                }
            )
            .store(in: &cancellables)
    }
    
    private func deleteFireStation(id: Int) {
        isLoading = true
        
        fireStationService.deleteFireStation(id: id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    
                    if case .failure(let error) = completion {
                        errorMessage = error.message
                    }
                },
                receiveValue: { _ in
                    // После успешного удаления обновляем список
                    loadFireStations()
                }
            )
            .store(in: &cancellables)
    }
}

struct FireStationRow: View {
    let station: FireStation
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(station.name)
                    .font(.headline)
                
                Text(station.address)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if let phoneNumber = station.phoneNumber {
                Text(phoneNumber)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 5)
    }
}

struct AddFireStationView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var name: String = ""
    @State private var address: String = ""
    @State private var latitude: String = ""
    @State private var longitude: String = ""
    @State private var phoneNumber: String = ""
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    private var fireStationService = FireStationService.shared
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
                    TextField("Название", text: $name)
                    TextField("Адрес", text: $address)
                    TextField("Телефон (опционально)", text: $phoneNumber)
                }
                
                Section(header: Text("Координаты")) {
                    TextField("Широта", text: $latitude)
                        .keyboardType(.decimalPad)
                    TextField("Долгота", text: $longitude)
                        .keyboardType(.decimalPad)
                }
                
                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                    }
                }
                
                Section {
                    Button(action: createFireStation) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle())
                                .frame(maxWidth: .infinity, alignment: .center)
                        } else {
                            Text("Создать пожарную часть")
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                    .disabled(name.isEmpty || address.isEmpty || latitude.isEmpty || longitude.isEmpty || isLoading)
                }
            }
            .navigationTitle("Новая пожарная часть")
            .navigationBarItems(
                trailing: Button("Отмена") {
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
    }
    
    private func createFireStation() {
        isLoading = true
        errorMessage = nil
        
        guard let lat = Double(latitude), let lng = Double(longitude) else {
            errorMessage = "Некорректные координаты"
            isLoading = false
            return
        }
        
        fireStationService.createFireStation(
            name: name,
            address: address,
            latitude: lat,
            longitude: lng,
            phoneNumber: phoneNumber.isEmpty ? nil : phoneNumber
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

struct FireStationDetailView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var isEditing = false
    @State private var name: String
    @State private var address: String
    @State private var latitude: String
    @State private var longitude: String
    @State private var phoneNumber: String
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    let station: FireStation
    var onComplete: (Bool) -> Void
    
    private var fireStationService = FireStationService.shared
    @State private var cancellables = Set<AnyCancellable>()
    
    init(station: FireStation, onComplete: @escaping (Bool) -> Void) {
        self.station = station
        self.onComplete = onComplete
        _name = State(initialValue: station.name)
        _address = State(initialValue: station.address)
        _latitude = State(initialValue: String(station.latitude))
        _longitude = State(initialValue: String(station.longitude))
        _phoneNumber = State(initialValue: station.phoneNumber ?? "")
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Информация о пожарной части")) {
                    if isEditing {
                        TextField("Название", text: $name)
                        TextField("Адрес", text: $address)
                        TextField("Телефон", text: $phoneNumber)
                        TextField("Широта", text: $latitude)
                            .keyboardType(.decimalPad)
                        TextField("Долгота", text: $longitude)
                            .keyboardType(.decimalPad)
                    } else {
                        HStack {
                            Text("ID")
                            Spacer()
                            Text("\(station.id)")
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Название")
                            Spacer()
                            Text(station.name)
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Адрес")
                            Spacer()
                            Text(station.address)
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Телефон")
                            Spacer()
                            Text(station.phoneNumber ?? "Не указан")
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Координаты")
                            Spacer()
                            Text("\(station.latitude), \(station.longitude)")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                    }
                }
                
                Section {
                    if isEditing {
                        Button(action: updateFireStation) {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle())
                                    .frame(maxWidth: .infinity, alignment: .center)
                            } else {
                                Text("Сохранить изменения")
                                    .frame(maxWidth: .infinity, alignment: .center)
                            }
                        }
                        .disabled(name.isEmpty || address.isEmpty || latitude.isEmpty || longitude.isEmpty || isLoading)
                        
                        Button(action: {
                            isEditing = false
                            // Восстанавливаем исходные значения
                            name = station.name
                            address = station.address
                            latitude = String(station.latitude)
                            longitude = String(station.longitude)
                            phoneNumber = station.phoneNumber ?? ""
                        }) {
                            Text("Отменить")
                                .foregroundColor(.red)
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                    } else {
                        Button(action: {
                            isEditing = true
                        }) {
                            Label("Редактировать", systemImage: "pencil")
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                }
            }
            .navigationTitle(isEditing ? "Редактирование" : "Пожарная часть")
            .navigationBarItems(
                trailing: Button(isEditing ? "Отмена" : "Закрыть") {
                    if isEditing {
                        isEditing = false
                        // Восстанавливаем исходные значения
                        name = station.name
                        address = station.address
                        latitude = String(station.latitude)
                        longitude = String(station.longitude)
                        phoneNumber = station.phoneNumber ?? ""
                    } else {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            )
        }
    }
    
    private func updateFireStation() {
        isLoading = true
        errorMessage = nil
        
        guard let lat = Double(latitude), let lng = Double(longitude) else {
            errorMessage = "Некорректные координаты"
            isLoading = false
            return
        }
        
        fireStationService.updateFireStation(
            id: station.id,
            name: name,
            address: address,
            latitude: lat,
            longitude: lng,
            phoneNumber: phoneNumber.isEmpty ? nil : phoneNumber
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completion in
                isLoading = false
                
                if case .failure(let error) = completion {
                    errorMessage = error.message
                }
            },
            receiveValue: { _ in
                isLoading = false
                isEditing = false
                onComplete(true)
                presentationMode.wrappedValue.dismiss()
            }
        )
        .store(in: &cancellables)
    }
}
