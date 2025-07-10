import "./Layout.less"
import React, {useState, useEffect} from 'react'
import JsonTool from '../JsonTool/JsonTool.tsx'
import KafkaTool from '../KafkaTool/KafkaTool.tsx'
import DiffTool from '../DiffTool/DiffTool.tsx'
import EventViewer from '../EventViewer/EventViewer.tsx'
import LogViewer from '../LogViewer/LogViewer.tsx'
import { eventLogger } from '../../utils/EventLogger'
import { useResponsive } from '../../hooks/useWindowSize'

interface ILayout {

}

const json = <JsonTool/>
const kafka = <KafkaTool/>
const diff = <DiffTool/>
const events = <EventViewer/>
const logs = <LogViewer/>

const Layout: React.FC<ILayout> = ({}) => {
    const [tool, setTool] = useState<React.ReactElement>(json)
    const { width, height, isMobile, isTablet, isDesktop, isSmallHeight, isVerySmallHeight } = useResponsive()

    // 监听窗口大小变化并记录
    useEffect(() => {
        eventLogger.logFrontendEvent('layout-resize', {
            width,
            height,
            isMobile,
            isTablet,
            isDesktop,
            isSmallHeight,
            isVerySmallHeight,
            timestamp: new Date().toISOString()
        });
    }, [width, height, isMobile, isTablet, isDesktop, isSmallHeight, isVerySmallHeight]);

    const changeTool = (nextTool: React.ReactElement, toolName: string) => {
        return () => {
            // 记录工具切换事件
            eventLogger.logFrontendEvent('tool-switch', {
                fromTool: getCurrentToolName(),
                toTool: toolName,
                windowSize: { width, height },
                timestamp: new Date().toISOString()
            });
            
            setTool(nextTool)
        }
    }

    // 获取当前工具名称
    const getCurrentToolName = (): string => {
        if (tool === json) return 'json';
        if (tool === kafka) return 'kafka';
        if (tool === diff) return 'diff';
        if (tool === events) return 'events';
        if (tool === logs) return 'logs';
        return 'unknown';
    }

    // 记录工具图标点击事件
    const handleToolClick = (toolName: string, nextTool: React.ReactElement) => {
        eventLogger.logFrontendEvent('tool-icon-click', {
            toolName,
            currentTool: getCurrentToolName(),
            windowSize: { width, height },
            deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
            timestamp: new Date().toISOString()
        });
        
        return changeTool(nextTool, toolName);
    }

    // 根据窗口大小动态调整布局类名
    const getLayoutClassName = () => {
        let className = 'layout-container';
        if (isMobile) className += ' layout-mobile';
        if (isTablet) className += ' layout-tablet';
        if (isDesktop) className += ' layout-desktop';
        if (isSmallHeight) className += ' layout-small-height';
        if (isVerySmallHeight) className += ' layout-very-small-height';
        return className;
    }

    return <div className={getLayoutClassName()}>
        <div className="left-bar-container">
            <div 
                className="tool-icon json-tool" 
                onClick={handleToolClick('json', json)}
                onMouseEnter={() => eventLogger.logFrontendEvent('tool-icon-hover', { tool: 'json' })}
                title="JSON 工具"
            ></div>
            <div 
                className="tool-icon diff-tool" 
                onClick={handleToolClick('diff', diff)}
                onMouseEnter={() => eventLogger.logFrontendEvent('tool-icon-hover', { tool: 'diff' })}
                title="对比工具"
            ></div>
            <div 
                className="tool-icon kafka-tool" 
                onClick={handleToolClick('kafka', kafka)}
                onMouseEnter={() => eventLogger.logFrontendEvent('tool-icon-hover', { tool: 'kafka' })}
                title="Kafka 工具"
            ></div>
            <div 
                className="tool-icon event-tool" 
                onClick={handleToolClick('events', events)}
                onMouseEnter={() => eventLogger.logFrontendEvent('tool-icon-hover', { tool: 'events' })}
                title="事件日志查看器"
            >📊</div>
            <div 
                className="tool-icon log-tool" 
                onClick={handleToolClick('logs', logs)}
                onMouseEnter={() => eventLogger.logFrontendEvent('tool-icon-hover', { tool: 'logs' })}
                title="日志文件查看器"
            >📋</div>
        </div>
        <div className="right-bar-container"></div>
        <div className="top-bar-container"></div>
        <div className="bottom-bar-container"></div>
        <div className="content-container">{tool}</div>
    </div>
}

export default Layout