// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::kafka::{fetch_message, send_message, topics};
use tauri::{GlobalWindowEvent, Manager, WindowMenuEvent};

mod kafka;
mod storage;

fn handle_window_event(event: GlobalWindowEvent) {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
        #[cfg(not(target_os = "macos"))]
        {
            event.window().hide().unwrap();
        }

        #[cfg(target_os = "macos")]
        {
            tauri::AppHandle::hide(&event.window().app_handle()).unwrap();
        }
        api.prevent_close();
    }
}

fn handle_menu_event(event: WindowMenuEvent) {
    match event.menu_item_id() {
        "quit" => {
            std::process::exit(0);
        }
        "close" => {
            event.window().close().unwrap();
        }
        _ => {}
    }
}

fn main() {
    use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
    // 这里 `"quit".to_string()` 定义菜单项 ID，第二个参数是菜单项标签。
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(close));
    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);

    tauri::Builder::default()
        // todo 加上了会导致复制粘贴快捷键失效
        // .menu(menu)
        .on_menu_event(handle_menu_event)
        .on_window_event(handle_window_event)
        .invoke_handler(tauri::generate_handler![
            topics,
            send_message,
            fetch_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
