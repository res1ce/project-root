//
//  firedispatch_iosApp.swift
//  firedispatch-ios
//
//  Created by Иван Вишняков on 26.05.2025.
//

import SwiftUI

@main
struct firedispatch_iosApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            if appState.isLoading {
                LoadingView()
            } else if appState.isAuthenticated {
                AdminDashboardView()
                    .environmentObject(appState)
            } else {
                LoginView()
                    .environmentObject(appState)
            }
        }
    }
}

struct LoadingView: View {
    var body: some View {
        VStack {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle())
                .scaleEffect(1.5)
            
            Text("Загрузка...")
                .font(.headline)
                .padding(.top, 20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}
