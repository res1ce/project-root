//
//  ContentView.swift
//  firedispatch-ios
//
//  Created by Иван Вишняков on 26.05.2025.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var appState = AppState()
    
    var body: some View {
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

#Preview {
    ContentView()
}
