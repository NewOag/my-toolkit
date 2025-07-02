// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::json::{compress, format, parse, recur_format, sort_format, stringify};
use crate::kafka::{fetch_message, send_message, topics};
use tauri::menu::MenuEvent;
use tauri::{Window, WindowEvent};

mod json;
mod kafka;
mod storage;

fn handle_window_event(window: &Window, event: &WindowEvent) {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        #[cfg(not(target_os = "macos"))]
        {
            window.hide().unwrap();
        }

        #[cfg(target_os = "macos")]
        {
            window.hide().unwrap();
        }
        api.prevent_close();
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        // todo 加上了会导致复制粘贴快捷键失效
        // .menu(menu)
        .invoke_handler(tauri::generate_handler![
            topics,
            send_message,
            fetch_message,
            format,
            recur_format,
            compress,
            stringify,
            parse,
            sort_format
        ])
        .on_window_event(handle_window_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
