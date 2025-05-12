import SwiftUI

struct FireIncidentsListView: View {
    @ObservedObject var viewModel: FireIncidentsViewModel
    var userRole: UserRole
    @State private var isPresentingFireDetail = false
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.fireIncidents.isEmpty {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(1.5)
                } else if viewModel.fireIncidents.isEmpty {
                    VStack {
                        Image(systemName: "flame.slash")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                            .padding()
                        
                        Text("Нет активных пожаров")
                            .font(.title2)
                            .foregroundColor(.gray)
                    }
                } else {
                    List {
                        ForEach(viewModel.fireIncidents) { fire in
                            FireIncidentRow(fire: fire, fireLevels: viewModel.fireLevels, fireStations: viewModel.fireStations)
                                .onTapGesture {
                                    viewModel.selectedFire = fire
                                    isPresentingFireDetail = true
                                }
                        }
                    }
                    .refreshable {
                        viewModel.loadFireIncidents()
                    }
                }
                
                if let error = viewModel.error {
                    VStack {
                        Spacer()
                        
                        Text(error)
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.red)
                            .cornerRadius(10)
                            .padding()
                        
                        Spacer().frame(height: 40)
                    }
                }
            }
            .navigationTitle("Пожары")
            .sheet(isPresented: $isPresentingFireDetail) {
                if let fire = viewModel.selectedFire {
                    FireDetailView(viewModel: viewModel, fire: fire, userRole: userRole)
                }
            }
            .onAppear {
                if viewModel.fireIncidents.isEmpty {
                    viewModel.loadFireIncidents()
                }
            }
        }
    }
}

struct FireIncidentRow: View {
    let fire: FireIncident
    let fireLevels: [FireLevel]
    let fireStations: [FireStation]
    
    var body: some View {
        HStack {
            Circle()
                .fill(statusColor)
                .frame(width: 16, height: 16)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("ID: \(fire.id)")
                    .font(.headline)
                
                if let address = fire.address {
                    Text(address)
                        .font(.subheadline)
                        .lineLimit(1)
                }
                
                HStack {
                    Text("Статус: \(translateFireStatus(fire.status))")
                        .font(.caption)
                    
                    Text("Уровень: \(getFireLevelName())")
                        .font(.caption)
                }
                .foregroundColor(.gray)
                
                Text("Часть: \(getFireStationName())")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                Text("Создан: \(fire.createdAt.formattedString())")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
        }
        .padding(.vertical, 8)
    }
    
    private func getFireLevelName() -> String {
        if let fireLevel = fire.fireLevel {
            return "\(fireLevel.name) (\(fireLevel.level))"
        } else if let level = fire.level {
            return "\(level.name) (\(level.level))"
        } else if let level = fireLevels.first(where: { $0.id == fire.fireLevelId }) {
            return "\(level.name) (\(level.level))"
        }
        return "Уровень \(fire.fireLevelId)"
    }
    
    private func getFireStationName() -> String {
        if let station = fire.fireStation {
            return station.name
        } else if let station = fire.assignedStation {
            return station.name
        } else if let station = fireStations.first(where: { $0.id == fire.fireStationId }) {
            return station.name
        }
        return "Не назначена"
    }
    
    var statusColor: Color {
        switch fire.status {
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