// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::json::{compress, format, parse, recur_format, sort_format, stringify};
use crate::kafka::{fetch_message, send_message, topics};
use tauri::{Manager, Window, WindowEvent};
use log;

use std::path::PathBuf;
use serde::{Deserialize, Serialize};

mod json;
mod kafka;
mod storage;
mod logger;

use logger::DualLogger;

#[derive(Debug, Serialize, Deserialize)]
struct FrontendEvent {
    event_type: String,
    payload: serde_json::Value,
    timestamp: String,
}

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
fn log_frontend_event(event: FrontendEvent) -> Result<(), String> {
    log::info!("前端事件: {} - {}", event.event_type, serde_json::to_string(&event.payload).unwrap_or_default());
    Ok(())
}

#[tauri::command]
fn get_log_file_path(app: tauri::AppHandle) -> Result<PathBuf, String> {
    log::debug!("获取日志目录路径");
    match app.path().app_log_dir() {
        Ok(log_dir) => {
            log::debug!("日志目录路径: {:?}", log_dir);
            Ok(log_dir)
        }
        Err(e) => {
            log::error!("获取日志目录失败: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn read_log_file(app: tauri::AppHandle) -> Result<String, String> {
    let log_dir = get_log_file_path(app)?;
    let app_log_path = log_dir.join("app.log");
    
    match std::fs::read_to_string(&app_log_path) {
        Ok(content) => Ok(content),
        Err(e) => {
            if e.kind() == std::io::ErrorKind::NotFound {
                Ok("# 日志文件不存在\n\n应用日志文件尚未创建。\n".to_string())
            } else {
                Err(format!("读取日志文件失败: {}", e))
            }
        }
    }
}

#[tauri::command]
async fn read_specific_log_file(app: tauri::AppHandle, filename: String) -> Result<String, String> {
    let log_dir = get_log_file_path(app)?;
    let log_path = log_dir.join(&filename);
    
    match std::fs::read_to_string(&log_path) {
        Ok(content) => Ok(content),
        Err(e) => {
            if e.kind() == std::io::ErrorKind::NotFound {
                Ok(format!("# 日志文件不存在\n\n文件 {} 尚未创建。\n", filename))
            } else {
                Err(format!("读取日志文件 {} 失败: {}", filename, e))
            }
        }
    }
}

#[tauri::command]
async fn clear_log_file(app: tauri::AppHandle, filename: String) -> Result<(), String> {
    let log_dir = get_log_file_path(app)?;
    let log_path = log_dir.join(&filename);
    
    match std::fs::write(&log_path, "") {
        Ok(_) => {
            log::info!("日志文件 {} 已清除", filename);
            Ok(())
        },
        Err(e) => Err(format!("清除日志文件 {} 失败: {}", filename, e))
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 初始化自定义日志器
            let log_dir = app.path().app_log_dir().unwrap_or_else(|_| {
                std::env::current_dir().unwrap().join("logs")
            });
            
            // 确保日志目录存在
            if !log_dir.exists() {
                if let Err(e) = std::fs::create_dir_all(&log_dir) {
                    eprintln!("创建日志目录失败: {:?}", e);
                }
            }

            let dual_logger = DualLogger::new(log_dir.clone())
                .expect("初始化日志器失败");

            // 设置全局日志器
            log::set_boxed_logger(Box::new(dual_logger))
                .expect("设置日志器失败");
            log::set_max_level(log::LevelFilter::Debug);

            log::info!("应用设置阶段开始");
            log::info!("使用自定义双日志器");
            log::info!("日志配置: app.log (所有日志), my-toolkit.log (交互事件)");
            log::info!("日志目录: {:?}", log_dir);
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
            log_frontend_event,
            get_log_file_path,
            read_log_file,
            read_specific_log_file,
            clear_log_file
        ])
        .on_window_event(handle_window_event)
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            eprintln!("error while running tauri application: {:?}", e);
            std::process::exit(1);
        });
}
