import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { eventLogger } from '../../utils/EventLogger';
import './LogViewer.less';

interface LogFile {
  name: string;
  path: string;
  content: string;
  size: number;
  lastModified: string;
}

const LogViewer: React.FC = () => {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // 日志文件列表
  const logFileList = [
    { name: '应用日志 (app.log)', path: 'app.log', description: '所有日志记录' },
    { name: '交互日志 (my-toolkit.log)', path: 'my-toolkit.log', description: '前后端交互事件' }
  ];

  // 获取日志文件路径
  const getLogFilePath = async (filename: string): Promise<string> => {
    try {
      const logDir = await invoke('get_log_file_path') as string;
      // 确保路径格式正确
      const normalizedLogDir = logDir.replace(/\\/g, '/');
      return `${normalizedLogDir}/${filename}`;
    } catch (error) {
      console.error('获取日志文件路径失败:', error);
      throw error;
    }
  };

  // 读取日志文件
  const readLogFile = async (filename: string): Promise<LogFile> => {
    try {
      const content = await invoke('read_specific_log_file', { filename }) as string;
      const path = await getLogFilePath(filename);
      
      return {
        name: filename,
        path,
        content,
        size: content.length,
        lastModified: new Date().toISOString()
      };
    } catch (error) {
      console.error(`读取日志文件 ${filename} 失败:`, error);
      throw error;
    }
  };

  // 加载所有日志文件
  const loadLogFiles = async () => {
    setIsLoading(true);
    setError('');

    try {
      eventLogger.logFrontendEvent('log-viewer-load-files', {
        timestamp: new Date().toISOString()
      });

      const files: LogFile[] = [];
      
      for (const fileInfo of logFileList) {
        try {
          const file = await readLogFile(fileInfo.path);
          files.push(file);
        } catch (error) {
          // 如果文件不存在，创建一个空的文件对象
          files.push({
            name: fileInfo.path,
            path: '',
            content: `# ${fileInfo.name}\n\n文件不存在或无法读取。\n\n错误信息: ${error}`,
            size: 0,
            lastModified: new Date().toISOString()
          });
        }
      }

      setLogFiles(files);
      
      // 如果没有选中文件，选择第一个
      if (!selectedFile && files.length > 0) {
        setSelectedFile(files[0].name);
      }

    } catch (error) {
      setError(`加载日志文件失败: ${error}`);
      eventLogger.logFrontendEvent('log-viewer-load-error', {
        error: error?.toString(),
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新当前选中的日志文件
  const refreshCurrentFile = async () => {
    if (!selectedFile) return;

    try {
      const updatedFiles = await Promise.all(
        logFiles.map(async (file) => {
          if (file.name === selectedFile) {
            return await readLogFile(file.name);
          }
          return file;
        })
      );

      setLogFiles(updatedFiles);
      
      eventLogger.logFrontendEvent('log-viewer-refresh-file', {
        filename: selectedFile,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setError(`刷新日志文件失败: ${error}`);
    }
  };

  // 清除日志文件
  const clearLogFile = async (filename: string) => {
    try {
      await invoke('clear_log_file', { filename });
      eventLogger.logFrontendEvent('log-viewer-clear-file', {
        filename,
        timestamp: new Date().toISOString()
      });
      
      // 重新加载文件
      await loadLogFiles();
    } catch (error) {
      setError(`清除日志文件失败: ${error}`);
    }
  };

  // 导出日志文件
  const exportLogFile = (filename: string) => {
    const file = logFiles.find(f => f.name === filename);
    if (!file) return;

    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    eventLogger.logFrontendEvent('log-viewer-export-file', {
      filename,
      timestamp: new Date().toISOString()
    });
  };

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshCurrentFile, 5000); // 每5秒刷新一次
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, selectedFile]);

  // 组件挂载时加载日志文件
  useEffect(() => {
    loadLogFiles();
  }, []);

  // 获取当前选中的文件
  const currentFile = logFiles.find(f => f.name === selectedFile);

  return (
    <div className="log-viewer-container">
      {/* 工具头部 */}
      <div className="log-viewer-header">
        <h1 className="log-viewer-title">
          <span className="log-viewer-icon" style={{background: '#6c5ce7'}}>📋</span>
          日志查看器
        </h1>
        <p className="log-viewer-description">
          查看应用日志文件，监控系统运行状态和交互事件
        </p>
      </div>

      {/* 控制面板 */}
      <div className="log-viewer-controls">
        <div className="file-selector">
          <label htmlFor="log-file-select">选择日志文件:</label>
          <select
            id="log-file-select"
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            disabled={isLoading}
          >
            {logFileList.map((file) => (
              <option key={file.path} value={file.path}>
                {file.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-buttons">
          <button
            className="btn btn-primary"
            onClick={loadLogFiles}
            disabled={isLoading}
            title="重新加载所有日志文件"
          >
            <span>🔄</span> 刷新
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={refreshCurrentFile}
            disabled={!selectedFile || isLoading}
            title="刷新当前选中的日志文件"
          >
            <span>📄</span> 刷新当前
          </button>

          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>自动刷新</span>
          </label>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="error-message">
          <span>❌</span> {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* 日志文件信息 */}
      {currentFile && (
        <div className="log-file-info">
          <div className="file-stats">
            <span>文件大小: {currentFile.size} 字节</span>
            <span>最后修改: {new Date(currentFile.lastModified).toLocaleString()}</span>
          </div>
          
          <div className="file-actions">
            <button
              className="btn btn-warning"
              onClick={() => clearLogFile(currentFile.name)}
              title="清除日志文件内容"
            >
              <span>🗑️</span> 清除
            </button>
            
            <button
              className="btn btn-success"
              onClick={() => exportLogFile(currentFile.name)}
              title="导出日志文件"
            >
              <span>💾</span> 导出
            </button>
          </div>
        </div>
      )}

      {/* 日志内容显示 */}
      <div className="log-content-container">
        <div className="log-content-header">
          <h3>日志内容</h3>
          {currentFile && (
            <span className="log-file-name">{currentFile.name}</span>
          )}
        </div>
        
        <div className="log-content">
          {isLoading ? (
            <div className="loading-message">
              <span>⏳</span> 正在加载日志文件...
            </div>
          ) : currentFile ? (
            <pre className="log-text">{currentFile.content}</pre>
          ) : (
            <div className="no-file-message">
              <span>📁</span> 请选择一个日志文件
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer; 