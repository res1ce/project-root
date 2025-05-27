import SwiftUI
import Combine

struct SystemSettingsView: View {
    @State private var settings: SystemSettings?
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    @State private var isEditing = false
    
    // Поля для редактирования
    @State private var defaultCityName: String = ""
    @State private var defaultLatitude: String = ""
    @State private var defaultLongitude: String = ""
    @State private var defaultZoom: String = ""
    
    private var systemSettingsService = SystemSettingsService.shared
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Системные настройки")
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
                } else if let settings = settings {
                    if isEditing {
                        editSettingsView()
                    } else {
                        settingsView(settings: settings)
                    }
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
            loadSettings()
        }
        .refreshable {
            loadSettings()
        }
    }
    
    private func settingsView(settings: SystemSettings) -> some View {
        VStack(spacing: 20) {
            // Информация о настройках
            VStack(alignment: .leading, spacing: 15) {
                HStack {
                    Text("Город по умолчанию")
                        .font(.headline)
                    Spacer()
                    Text(settings.defaultCityName)
                        .foregroundColor(.secondary)
                }
                
                Divider()
                
                HStack {
                    Text("Координаты по умолчанию")
                        .font(.headline)
                    Spacer()
                    Text("\(settings.defaultLatitude), \(settings.defaultLongitude)")
                        .foregroundColor(.secondary)
                }
                
                Divider()
                
                HStack {
                    Text("Масштаб по умолчанию")
                        .font(.headline)
                    Spacer()
                    Text("\(settings.defaultZoom)")
                        .foregroundColor(.secondary)
                }
                
                Divider()
                
                HStack {
                    Text("Последнее обновление")
                        .font(.headline)
                    Spacer()
                    Text(formatDate(settings.updatedAt))
                        .foregroundColor(.secondary)
                }
                
                if let updatedBy = settings.updatedBy {
                    Divider()
                    
                    HStack {
                        Text("Обновил")
                            .font(.headline)
                        Spacer()
                        Text(updatedBy.name)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
            .padding(.horizontal)
            
            // Кнопка редактирования
            Button(action: {
                prepareForEditing()
            }) {
                Text("Редактировать настройки")
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            .padding(.horizontal)
        }
    }
    
    private func editSettingsView() -> some View {
        VStack(spacing: 20) {
            // Форма редактирования
            VStack(alignment: .leading, spacing: 15) {
                Text("Город по умолчанию")
                    .font(.headline)
                TextField("Город", text: $defaultCityName)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                
                Text("Широта")
                    .font(.headline)
                TextField("Широта", text: $defaultLatitude)
                    .keyboardType(.decimalPad)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                
                Text("Долгота")
                    .font(.headline)
                TextField("Долгота", text: $defaultLongitude)
                    .keyboardType(.decimalPad)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                
                Text("Масштаб")
                    .font(.headline)
                TextField("Масштаб", text: $defaultZoom)
                    .keyboardType(.decimalPad)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .padding(.top)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
            .padding(.horizontal)
            
            // Кнопки сохранения и отмены
            HStack(spacing: 15) {
                Button(action: {
                    isEditing = false
                    errorMessage = nil
                }) {
                    Text("Отмена")
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                }
                
                Button(action: saveSettings) {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(10)
                    } else {
                        Text("Сохранить")
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(10)
                    }
                }
                .disabled(defaultCityName.isEmpty || defaultLatitude.isEmpty || defaultLongitude.isEmpty || defaultZoom.isEmpty || isLoading)
            }
            .padding(.horizontal)
        }
    }
    
    private func loadSettings() {
        isLoading = true
        errorMessage = nil
        
        systemSettingsService.getSystemSettings()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    
                    if case .failure(let error) = completion {
                        errorMessage = error.message
                    }
                },
                receiveValue: { settings in
                    self.settings = settings
                    isLoading = false
                }
            )
            .store(in: &cancellables)
    }
    
    private func prepareForEditing() {
        guard let settings = settings else { return }
        
        defaultCityName = settings.defaultCityName
        defaultLatitude = String(settings.defaultLatitude)
        defaultLongitude = String(settings.defaultLongitude)
        defaultZoom = String(settings.defaultZoom)
        
        isEditing = true
    }
    
    private func saveSettings() {
        isLoading = true
        errorMessage = nil
        
        guard let lat = Double(defaultLatitude),
              let lng = Double(defaultLongitude),
              let zoom = Double(defaultZoom) else {
            errorMessage = "Некорректные числовые значения"
            isLoading = false
            return
        }
        
        systemSettingsService.updateSystemSettings(
            defaultCityName: defaultCityName,
            defaultLatitude: lat,
            defaultLongitude: lng,
            defaultZoom: zoom
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completion in
                isLoading = false
                
                if case .failure(let error) = completion {
                    errorMessage = error.message
                }
            },
            receiveValue: { updatedSettings in
                isLoading = false
                isEditing = false
                settings = updatedSettings
            }
        )
        .store(in: &cancellables)
    }
    
    private func formatDate(_ dateString: String) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        guard let date = dateFormatter.date(from: dateString) else {
            return dateString
        }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateStyle = .medium
        displayFormatter.timeStyle = .short
        displayFormatter.locale = Locale(identifier: "ru_RU")
        
        return displayFormatter.string(from: date)
    }
}
