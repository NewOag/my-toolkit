import { listen, Event } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

export interface EventLog {
  timestamp: string;
  eventType: string;
  payload: any;
  source: 'frontend' | 'backend';
}

class EventLogger {
  private logs: EventLog[] = [];
  private listeners: (() => void)[] = [];
  private isInitialized = false;

  // 初始化事件监听器
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[EventLogger] 初始化事件监听器');

    try {
      // 监听所有 Tauri 系统事件
      const systemEvents = [
        'tauri://created',
        'tauri://error',
        'tauri://update',
        'tauri://update-available',
        'tauri://update-install',
        'tauri://update-status',
        'tauri://menu',
        'tauri://file-drop',
        'tauri://file-drop-hover',
        'tauri://file-drop-cancelled',
        'tauri://window-created',
        'tauri://focus',
        'tauri://blur',
        'tauri://close-requested',
        'tauri://resize',
        'tauri://move',
        'tauri://scale-change',
        'tauri://theme-changed'
      ];

      // 为每个系统事件添加监听器
      for (const eventName of systemEvents) {
        const unlisten = await listen(eventName, (event: Event<any>) => {
          this.logEvent({
            timestamp: new Date().toISOString(),
            eventType: eventName,
            payload: event.payload,
            source: 'backend'
          });
        });
        this.listeners.push(unlisten);
      }

      // 监听自定义事件（通配符不支持，所以监听常见的自定义事件）
      const customEvents = [
        'app-ready',
        'user-action',
        'data-updated',
        'error-occurred',
        'notification'
      ];

      for (const eventName of customEvents) {
        const unlisten = await listen(eventName, (event: Event<any>) => {
          this.logEvent({
            timestamp: new Date().toISOString(),
            eventType: eventName,
            payload: event.payload,
            source: 'frontend'
          });
        });
        this.listeners.push(unlisten);
      }

      this.isInitialized = true;
      console.log('[EventLogger] 事件监听器初始化完成');

      // 记录初始化事件
      this.logEvent({
        timestamp: new Date().toISOString(),
        eventType: 'event-logger-initialized',
        payload: { message: '事件日志系统已启动' },
        source: 'frontend'
      });

    } catch (error) {
      console.error('[EventLogger] 初始化失败:', error);
    }
  }

  // 记录事件
  private logEvent(eventLog: EventLog): void {
    this.logs.push(eventLog);
    
    // 控制台输出
    console.log(`[EventLogger] ${eventLog.source.toUpperCase()} 事件:`, {
      type: eventLog.eventType,
      time: eventLog.timestamp,
      payload: eventLog.payload
    });

    // 限制日志数量，避免内存溢出
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500); // 保留最新的500条
    }

    // 发送到后端日志系统
    this.sendToBackendLogger(eventLog);
  }

  // 发送事件到后端日志系统
  private async sendToBackendLogger(eventLog: EventLog): Promise<void> {
    try {
      // 调用后端命令来记录事件
      await invoke('log_frontend_event', {
        event: {
          event_type: eventLog.eventType,
          payload: eventLog.payload,
          timestamp: eventLog.timestamp
        }
      });
    } catch (error) {
      // 静默处理，避免日志记录本身产生错误
      console.debug('[EventLogger] 发送到后端失败:', error);
    }
  }

  // 手动记录前端事件
  logFrontendEvent(eventType: string, payload: any = {}): void {
    this.logEvent({
      timestamp: new Date().toISOString(),
      eventType: `frontend-${eventType}`,
      payload,
      source: 'frontend'
    });
  }

  // 获取所有日志
  getLogs(): EventLog[] {
    return [...this.logs];
  }

  // 获取最近的日志
  getRecentLogs(count: number = 50): EventLog[] {
    return this.logs.slice(-count);
  }

  // 按事件类型过滤日志
  getLogsByType(eventType: string): EventLog[] {
    return this.logs.filter(log => log.eventType.includes(eventType));
  }

  // 清除日志
  clearLogs(): void {
    this.logs = [];
    console.log('[EventLogger] 日志已清除');
  }

  // 导出日志为 JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // 销毁监听器
  destroy(): void {
    this.listeners.forEach(unlisten => unlisten());
    this.listeners = [];
    this.isInitialized = false;
    console.log('[EventLogger] 事件监听器已销毁');
  }
}

// 创建单例实例
export const eventLogger = new EventLogger();

// 自动初始化（在模块加载时）
eventLogger.initialize().catch(console.error);

export default EventLogger; 