import React, { useState, useEffect } from 'react';
import { eventLogger, EventLog } from '../../utils/EventLogger';
import './EventViewer.less';

const EventViewer: React.FC = () => {
    const [logs, setLogs] = useState<EventLog[]>([]);
    const [filter, setFilter] = useState<string>('');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'frontend' | 'backend'>('all');
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

    // 刷新日志
    const refreshLogs = () => {
        const allLogs = eventLogger.getLogs();
        let filteredLogs = allLogs;

        // 按来源过滤
        if (sourceFilter !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.source === sourceFilter);
        }

        // 按事件类型过滤
        if (filter) {
            filteredLogs = filteredLogs.filter(log => 
                log.eventType.toLowerCase().includes(filter.toLowerCase())
            );
        }

        setLogs(filteredLogs.slice(-100)); // 只显示最新的100条
    };

    // 自动刷新
    useEffect(() => {
        refreshLogs();
        
        if (autoRefresh) {
            const interval = setInterval(refreshLogs, 1000);
            return () => clearInterval(interval);
        }
    }, [filter, sourceFilter, autoRefresh]);

    // 清除日志
    const clearLogs = () => {
        eventLogger.clearLogs();
        setLogs([]);
    };

    // 导出日志
    const exportLogs = () => {
        const data = eventLogger.exportLogs();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event-logs-${new Date().toISOString().slice(0, 19)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        eventLogger.logFrontendEvent('logs-exported', {
            count: logs.length,
            timestamp: new Date().toISOString()
        });
    };

    // 格式化时间戳
    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    // 获取事件类型的样式类
    const getEventTypeClass = (eventType: string, source: string) => {
        if (source === 'backend') return 'event-backend';
        if (eventType.includes('error')) return 'event-error';
        if (eventType.includes('success')) return 'event-success';
        if (eventType.includes('start')) return 'event-start';
        return 'event-info';
    };

    return (
        <div className="event-viewer">
            <div className="event-viewer-header">
                <h2>事件日志查看器</h2>
                <div className="controls">
                    <input
                        type="text"
                        placeholder="过滤事件类型..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-input"
                    />
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as 'all' | 'frontend' | 'backend')}
                        className="source-filter"
                    >
                        <option value="all">所有来源</option>
                        <option value="frontend">前端</option>
                        <option value="backend">后端</option>
                    </select>
                    <label className="auto-refresh">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        自动刷新
                    </label>
                    <button onClick={refreshLogs} className="refresh-btn">刷新</button>
                    <button onClick={clearLogs} className="clear-btn">清除</button>
                    <button onClick={exportLogs} className="export-btn">导出</button>
                </div>
            </div>
            
            <div className="event-list">
                <div className="event-count">
                    显示 {logs.length} 条事件 (总计 {eventLogger.getLogs().length} 条)
                </div>
                
                {logs.length === 0 ? (
                    <div className="no-events">暂无事件日志</div>
                ) : (
                    <div className="events">
                        {logs.map((log, index) => (
                            <div
                                key={index}
                                className={`event-item ${getEventTypeClass(log.eventType, log.source)}`}
                            >
                                <div className="event-header">
                                    <span className="event-time">{formatTimestamp(log.timestamp)}</span>
                                    <span className="event-source">[{log.source.toUpperCase()}]</span>
                                    <span className="event-type">{log.eventType}</span>
                                </div>
                                <div className="event-payload">
                                    <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventViewer; 