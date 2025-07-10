import "./App.less";
import Layout from './pages/Layout/Layout.tsx'
import WindowStatus from './components/WindowStatus/WindowStatus.tsx'
import { useEffect, useState } from 'react';
import { eventLogger } from './utils/EventLogger';

function App() {
    const [showWindowStatus, setShowWindowStatus] = useState(false);

    useEffect(() => {
        // 确保事件日志系统已初始化
        eventLogger.initialize().then(() => {
            console.log('App: 事件日志系统已就绪');
            
            // 记录应用启动事件
            eventLogger.logFrontendEvent('app-mounted', {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                windowSize: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            });
        });

        // 监听键盘快捷键显示/隐藏窗口状态
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl/Cmd + Shift + W 切换窗口状态显示
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'W') {
                event.preventDefault();
                setShowWindowStatus(prev => !prev);
                eventLogger.logFrontendEvent('window-status-toggle', {
                    visible: !showWindowStatus,
                    timestamp: new Date().toISOString()
                });
            }
        };

        // 监听全局错误
        const handleError = (event: ErrorEvent) => {
            eventLogger.logFrontendEvent('global-error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.toString()
            });
        };

        // 监听未处理的 Promise 拒绝
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            eventLogger.logFrontendEvent('unhandled-promise-rejection', {
                reason: event.reason?.toString(),
                type: event.type
            });
        };

        // 监听页面可见性变化
        const handleVisibilityChange = () => {
            eventLogger.logFrontendEvent('visibility-change', {
                hidden: document.hidden,
                visibilityState: document.visibilityState
            });
        };

        // 监听窗口焦点变化
        const handleFocus = () => {
            eventLogger.logFrontendEvent('window-focus', { focused: true });
        };

        const handleBlur = () => {
            eventLogger.logFrontendEvent('window-blur', { focused: false });
        };

        // 监听窗口大小变化
        const handleResize = () => {
            eventLogger.logFrontendEvent('window-resize', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        // 添加事件监听器
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('resize', handleResize);

        // 清理函数
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('resize', handleResize);
            
            // 记录应用卸载事件
            eventLogger.logFrontendEvent('app-unmount', {
                timestamp: new Date().toISOString()
            });
        };
    }, [showWindowStatus]);

    return <>
        <Layout/>
        <WindowStatus visible={showWindowStatus} />
    </>
}

export default App;
