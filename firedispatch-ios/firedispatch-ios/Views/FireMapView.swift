import SwiftUI
import MapKit

// Enum для работы с разными типами аннотаций на карте
enum MapItem: Identifiable {
    case fire(FireIncident)
    case station(FireStation)
    
    var id: Int {
        switch self {
        case .fire(let incident):
            return incident.id
        case .station(let station):
            return station.id
        }
    }
    
    var coordinate: CLLocationCoordinate2D {
        switch self {
        case .fire(let incident):
            return incident.coordinate
        case .station(let station):
            return station.coordinate
        }
    }
}

struct FireMapView: View {
    @ObservedObject var viewModel: FireIncidentsViewModel
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 52.0515, longitude: 113.4712), // Чита
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    @State private var isAddingFire = false
    @State private var selectedLocation: CLLocationCoordinate2D?
    @State private var showFireForm = false
    @State private var isPresentingFireDetail = false
    
    // Для формы добавления пожара
    @State private var fireAddress: String = ""
    @State private var fireDescription: String = ""
    @State private var selectedFireLevelId: Int = 1
    
    var userRole: UserRole
    
    var body: some View {
        ZStack {
            // Карта с двумя типами аннотаций
            Map(coordinateRegion: $region, annotationItems: mapItems) { item in
                MapAnnotation(coordinate: item.coordinate) {
                    switch item {
                    case .fire(let fire):
                        FireAnnotationView(status: fire.status)
                            .onTapGesture {
                                viewModel.selectedFire = fire
                                isPresentingFireDetail = true
                            }
                    case .station(let station):
                        FireStationAnnotationView(name: station.name)
                    }
                }
            }
            .overlay(
                Group {
                    if isAddingFire && userRole == .centralDispatcher {
                        Circle()
                            .fill(Color.red.opacity(0.3))
                            .frame(width: 30, height: 30)
                            .position(x: UIScreen.main.bounds.width / 2, y: UIScreen.main.bounds.height / 2)
                    }
                }
            )
            .gesture(
                userRole == .centralDispatcher ?
                    TapGesture()
                        .onEnded { _ in
                            if isAddingFire {
                                selectedLocation = region.center
                                showFireForm = true
                            }
                        } : nil
            )
            .ignoresSafeArea(edges: .top)
            
            // Панель управления
            VStack {
                Spacer()
                
                HStack {
                    Spacer()
                    
                    if userRole == .centralDispatcher {
                        Button(action: {
                            isAddingFire.toggle()
                        }) {
                            Image(systemName: isAddingFire ? "xmark" : "plus")
                                .font(.title)
                                .padding()
                                .background(Color.red)
                                .foregroundColor(.white)
                                .clipShape(Circle())
                                .shadow(radius: 4)
                        }
                        .padding()
                    }
                }
            }
        }
        .sheet(isPresented: $showFireForm) {
            AddFireFormView(
                viewModel: viewModel,
                isPresented: $showFireForm,
                location: selectedLocation!,
                address: $fireAddress,
                description: $fireDescription,
                selectedFireLevelId: $selectedFireLevelId
            )
        }
        .sheet(isPresented: $isPresentingFireDetail) {
            if let fire = viewModel.selectedFire {
                FireDetailView(viewModel: viewModel, fire: fire, userRole: userRole)
            }
        }
        .onAppear {
            requestNotificationPermission()
            print("FireMapView загружена. Пожаров: \(viewModel.fireIncidents.count), Станций: \(viewModel.fireStations.count)")
            
            // Если данные еще не загружены, загружаем их
            if viewModel.fireIncidents.isEmpty || viewModel.fireStations.isEmpty {
                print("Загружаем данные для карты...")
                viewModel.loadData()
            }
        }
    }
    
    // Преобразование массивов в единый массив аннотаций
    private var mapItems: [MapItem] {
        let fireItems = viewModel.fireIncidents.map { MapItem.fire($0) }
        let stationItems = viewModel.fireStations.map { MapItem.station($0) }
        return fireItems + stationItems
    }
    
    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { success, error in
            if let error = error {
                print("Notification permission error: \(error)")
            }
        }
    }
}

struct FireAnnotationView: View {
    var status: IncidentStatus
    
    var body: some View {
        ZStack {
            Circle()
                .fill(statusColor)
                .frame(width: 30, height: 30)
            
            Image(systemName: "flame.fill")
                .foregroundColor(.white)
                .font(.system(size: 14))
        }
    }
    
    var statusColor: Color {
        switch status {
        case .pending:
            return .yellow
        case .inProgress:
            return .orange
        case .resolved:
            return .green
        case .cancelled:
            return .gray
        }
    }
}

struct FireStationAnnotationView: View {
    var name: String
    
    var body: some View {
        ZStack {
            Circle()
                .fill(Color.blue)
                .frame(width: 30, height: 30)
                .shadow(radius: 3)
            
            Image(systemName: "building.2.fill")
                .foregroundColor(.white)
                .font(.system(size: 14))
        }
        .overlay(
            Text(name)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .padding(4)
                .background(Color.blue.opacity(0.8))
                .cornerRadius(8)
                .offset(y: 20)
                .fixedSize()
        )
    }
}

struct AddFireFormView: View {
    @ObservedObject var viewModel: FireIncidentsViewModel
    @Binding var isPresented: Bool
    let location: CLLocationCoordinate2D
    @Binding var address: String
    @Binding var description: String
    @Binding var selectedFireLevelId: Int
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Местоположение")) {
                    HStack {
                        Text("Широта:")
                        Spacer()
                        Text(String(format: "%.6f", location.latitude))
                            .foregroundColor(.gray)
                    }
                    
                    HStack {
                        Text("Долгота:")
                        Spacer()
                        Text(String(format: "%.6f", location.longitude))
                            .foregroundColor(.gray)
                    }
                    
                    TextField("Адрес", text: $address)
                }
                
                Section(header: Text("Информация о пожаре")) {
                    TextField("Описание", text: $description)
                    
                    Picker("Уровень пожара", selection: $selectedFireLevelId) {
                        ForEach(viewModel.fireLevels) { level in
                            Text("\(level.name) (\(level.level))").tag(level.id)
                        }
                    }
                }
                
                Section {
                    Button("Сохранить") {
                        viewModel.createFireIncident(
                            coordinate: location,
                            address: address,
                            description: description,
                            fireLevelId: selectedFireLevelId
                        )
                        isPresented = false
                    }
                    .disabled(viewModel.isLoading)
                    
                    Button("Отмена") {
                        isPresented = false
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Добавить пожар")
        }
    }
}

struct FireDetailView: View {
    @ObservedObject var viewModel: FireIncidentsViewModel
    let fire: FireIncident
    let userRole: UserRole
    @State private var selectedStatus: IncidentStatus
    @State private var selectedFireLevelId: Int
    @Environment(\.presentationMode) var presentationMode
    
    init(viewModel: FireIncidentsViewModel, fire: FireIncident, userRole: UserRole) {
        self.viewModel = viewModel
        self.fire = fire
        self.userRole = userRole
        _selectedStatus = State(initialValue: fire.status)
        _selectedFireLevelId = State(initialValue: fire.fireLevelId)
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Информация о пожаре")) {
                    HStack {
                        Text("ID")
                        Spacer()
                        Text("\(fire.id)")
                            .foregroundColor(.gray)
                    }
                    
                    if let address = fire.address {
                        HStack {
                            Text("Адрес")
                            Spacer()
                            Text(address)
                                .foregroundColor(.gray)
                        }
                    }
                    
                    if let description = fire.description {
                        HStack {
                            Text("Описание")
                            Spacer()
                            Text(description)
                                .foregroundColor(.gray)
                        }
                    }
                    
                    HStack {
                        Text("Создан")
                        Spacer()
                        Text(fire.createdAt.formattedRussianStyle())
                            .foregroundColor(.gray)
                    }
                    
                    if let updatedAt = fire.updatedAt {
                        HStack {
                            Text("Обновлен")
                            Spacer()
                            Text(updatedAt.formattedRussianStyle())
                                .foregroundColor(.gray)
                        }
                    }
                }
                
                Section(header: Text("Статус")) {
                    Picker("Текущий статус", selection: $selectedStatus) {
                        ForEach(IncidentStatus.allCases, id: \.self) { status in
                            HStack {
                                Circle()
                                    .fill(statusColor(status))
                                    .frame(width: 10, height: 10)
                                Text(translateFireStatus(status))
                            }
                            .tag(status)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .disabled(userRole == .centralDispatcher)
                    
                    if selectedStatus != fire.status {
                        Button("Обновить статус") {
                            viewModel.changeFireStatus(fire: fire, status: selectedStatus)
                            presentationMode.wrappedValue.dismiss()
                        }
                        .foregroundColor(.blue)
                    }
                }
                
                Section(header: Text("Уровень пожара")) {
                    Picker("Уровень пожара", selection: $selectedFireLevelId) {
                        ForEach(viewModel.fireLevels) { level in
                            Text("\(level.name) (\(level.level))").tag(level.id)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .disabled(userRole == .centralDispatcher && fire.status != .pending)
                    
                    if selectedFireLevelId != fire.fireLevelId {
                        Button("Обновить уровень") {
                            viewModel.changeFireLevel(fire: fire, fireLevelId: selectedFireLevelId)
                            presentationMode.wrappedValue.dismiss()
                        }
                        .foregroundColor(.blue)
                    }
                }
                
                Section(header: Text("Пожарная часть")) {
                    HStack {
                        Text("Назначенная часть")
                        Spacer()
                        Text(getFireStationName())
                            .foregroundColor(.gray)
                    }
                }
            }
            .navigationTitle("Детали пожара")
            .navigationBarItems(trailing: Button("Закрыть") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
    
    private func getFireStationName() -> String {
        if let station = fire.fireStation {
            return station.name
        } else if let station = fire.assignedStation {
            return station.name
        } else if let station = viewModel.fireStations.first(where: { $0.id == fire.fireStationId }) {
            return station.name
        }
        return "Неизвестно"
    }
    
    private func statusColor(_ status: IncidentStatus) -> Color {
        switch status {
        case .pending:
            return .yellow
        case .inProgress:
            return .orange
        case .resolved:
            return .green
        case .cancelled:
            return .gray
        }
    }
} 