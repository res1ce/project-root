//
//  firedispatch_iosApp.swift
//  firedispatch-ios
//
//  Created by Иван Вишняков on 12.05.2025.
//

import SwiftUI
import UserNotifications

@main
struct firedispatch_iosApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some Scene {
        WindowGroup {
            ZStack {
                if authViewModel.isAuthenticated {
                    MainTabView(authViewModel: authViewModel)
                } else {
                    LoginView(viewModel: authViewModel)
                }
            }
            .onAppear {
                // Запрашиваем разрешение на уведомления при запуске
                UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { success, error in
                    if let error = error {
                        print("Notification permission error: \(error)")
                    }
                }
            }
        }
    }
}
