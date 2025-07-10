use log::{LevelFilter, Log, Metadata, Record};
use std::sync::Mutex;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;

pub struct DualLogger {
    app_logger: Mutex<AppLogger>,
    toolkit_logger: Mutex<ToolkitLogger>,
}

struct AppLogger {
    file: std::fs::File,
}

struct ToolkitLogger {
    file: std::fs::File,
}

impl DualLogger {
    pub fn new(log_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let app_log_path = log_dir.join("app.log");
        let toolkit_log_path = log_dir.join("my-toolkit.log");

        let app_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(app_log_path)?;

        let toolkit_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(toolkit_log_path)?;

        Ok(DualLogger {
            app_logger: Mutex::new(AppLogger { file: app_file }),
            toolkit_logger: Mutex::new(ToolkitLogger { file: toolkit_file }),
        })
    }

    fn is_interaction_event(record: &Record) -> bool {
        let target = record.target();
        let args = record.args().to_string();
        
        // 检查是否是前后端交互相关的事件
        target.contains("json") || 
        target.contains("kafka") || 
        target.contains("storage") ||
        args.contains("invoke") ||
        args.contains("command") ||
        args.contains("topics") ||
        args.contains("send_message") ||
        args.contains("fetch_message") ||
        args.contains("format") ||
        args.contains("compress") ||
        args.contains("stringify") ||
        args.contains("parse") ||
        args.contains("sort_format") ||
        args.contains("recur_format") ||
        args.contains("get_log_file_path") ||
        args.contains("read_log_file")
    }
}

impl Log for DualLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= LevelFilter::Debug
    }

    fn log(&self, record: &Record) {
        if !self.enabled(record.metadata()) {
            return;
        }

        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        let level = record.level();
        let target = record.target();
        let args = record.args();
        
        let log_entry = format!("[{}] {} [{}] {}\n", timestamp, level, target, args);

        // 所有日志都写入 app.log
        if let Ok(mut app_logger) = self.app_logger.lock() {
            let _ = app_logger.file.write_all(log_entry.as_bytes());
            let _ = app_logger.file.flush();
        }

        // 只有交互事件才写入 my-toolkit.log
        if Self::is_interaction_event(record) {
            if let Ok(mut toolkit_logger) = self.toolkit_logger.lock() {
                let _ = toolkit_logger.file.write_all(log_entry.as_bytes());
                let _ = toolkit_logger.file.flush();
            }
        }
    }

    fn flush(&self) {
        if let Ok(mut app_logger) = self.app_logger.lock() {
            let _ = app_logger.file.flush();
        }
        if let Ok(mut toolkit_logger) = self.toolkit_logger.lock() {
            let _ = toolkit_logger.file.flush();
        }
    }
} 