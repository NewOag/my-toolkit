// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{GlobalWindowEvent, Manager};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn handle_window_event(event: GlobalWindowEvent) {
    match event.event() {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            #[cfg(not(target_os = "macos"))] {
                event.window().hide().unwrap();
            }

            #[cfg(target_os = "macos")] {
                tauri::AppHandle::hide(&event.window().app_handle()).unwrap();
            }
            api.prevent_close();
        }
        _ => {}
    }
}

fn main() {
    tauri::Builder::default()
        .on_window_event(handle_window_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
