// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::json::{compress, format, parse, recur_format, sort_format, stringify};
use crate::kafka::{fetch_message, send_message, topics};
use tauri::{Manager, Window, WindowEvent};
use log;
use std::fs;
use std::path::PathBuf;

mod json;
mod kafka;
mod storage;

fn handle_window_event(window: &Window, event: &WindowEvent) {
    match event {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            log::info!("用户尝试关闭窗口，隐藏应用");
            #[cfg(not(target_os = "macos"))]
            {
                log::debug!("非 macOS 平台，隐藏窗口");
                if let Err(e) = window.hide() {
                    log::error!("隐藏窗口失败: {:?}", e);
                } else {
                    log::debug!("窗口隐藏成功");
                }
            }

            #[cfg(target_os = "macos")]
            {
                log::debug!("macOS 平台，隐藏窗口");
                if let Err(e) = window.hide() {
                    log::error!("隐藏窗口失败: {:?}", e);
                } else {
                    log::debug!("窗口隐藏成功");
                }
            }
            api.prevent_close();
            log::debug!("阻止窗口关闭");
        }
        tauri::WindowEvent::Resized(size) => {
            log::debug!("窗口大小改变: {}x{}", size.width, size.height);
        }
        tauri::WindowEvent::Moved(position) => {
            log::debug!("窗口位置改变: x={}, y={}", position.x, position.y);
        }
        tauri::WindowEvent::Focused(focused) => {
            log::debug!("窗口焦点改变: {}", focused);
        }
        tauri::WindowEvent::ScaleFactorChanged { scale_factor, new_inner_size, .. } => {
            log::debug!("窗口缩放因子改变: scale={}, new_size={}x{}", 
                       scale_factor, new_inner_size.width, new_inner_size.height);
        }
        tauri::WindowEvent::ThemeChanged(theme) => {
            log::info!("主题改变: {:?}", theme);
        }
        _ => {
            log::debug!("其他窗口事件: {:?}", event);
        }
    }
}

#[tauri::command]
fn get_log_file_path(app: tauri::AppHandle) -> Result<PathBuf, String> {
    log::debug!("获取日志文件路径");
    match app.path().app_log_dir() {
        Ok(log_dir) => {
            let path = log_dir.join("my-toolkit.log");
            log::debug!("日志文件路径: {:?}", path);
            Ok(path)
        }
        Err(e) => {
            log::error!("获取日志目录失败: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
fn read_log_file(app: tauri::AppHandle) -> Result<String, String> {
    log::info!("读取日志文件");
    match app.path().app_log_dir() {
        Ok(log_dir) => {
            let log_path = log_dir.join("my-toolkit.log");
            log::debug!("日志文件路径: {:?}", log_path);
            
            match fs::read_to_string(&log_path) {
                Ok(content) => {
                    log::info!("日志文件读取成功，大小: {} 字节", content.len());
                    Ok(content)
                }
                Err(e) => {
                    log::error!("读取日志文件失败: {:?}", e);
                    Err(e.to_string())
                }
            }
        }
        Err(e) => {
            log::error!("获取日志目录失败: {:?}", e);
            Err(e.to_string())
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Debug)
                .build(),
        )
        .setup(|_app| {
            log::info!("应用设置阶段开始");
            log::info!("使用 Tauri 官方日志插件");
            log::info!("应用启动完成，窗口事件监听已设置");
            Ok(())
        })
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            topics,
            send_message,
            fetch_message,
            format,
            recur_format,
            compress,
            stringify,
            parse,
            sort_format,
            get_log_file_path,
            read_log_file
        ])
        .on_window_event(handle_window_event)
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            log::error!("应用运行失败: {:?}", e);
            eprintln!("error while running tauri application: {:?}", e);
            std::process::exit(1);
        });
}
