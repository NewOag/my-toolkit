import "./Layout.less"
import React, {useState} from 'react'
import JsonTool from '../JsonTool/JsonTool.tsx'
import KafkaTool from '../KafkaTool/KafkaTool.tsx'
import DiffTool from '../DiffTool/DiffTool.tsx'
import EventViewer from '../EventViewer/EventViewer.tsx'
import { eventLogger } from '../../utils/EventLogger'

interface ILayout {

}

const json = <JsonTool/>
const kafka = <KafkaTool/>
const diff = <DiffTool/>
const events = <EventViewer/>

const Layout: React.FC<ILayout> = ({}) => {
    const [tool, setTool] = useState<React.ReactElement>(json)

    const changeTool = (nextTool: React.ReactElement, toolName: string) => {
        return () => {
            // 记录工具切换事件
            eventLogger.logFrontendEvent('tool-switch', {
                fromTool: getCurrentToolName(),
                toTool: toolName,
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
        return 'unknown';
    }

    // 记录工具图标点击事件
    const handleToolClick = (toolName: string, nextTool: React.ReactElement) => {
        eventLogger.logFrontendEvent('tool-icon-click', {
            toolName,
            currentTool: getCurrentToolName(),
            timestamp: new Date().toISOString()
        });
        
        return changeTool(nextTool, toolName);
    }

    return <div className="layout-container">
        <div className="left-bar-container">
            <div 
                className="tool-icon json-tool" 
                onClick={handleToolClick('json', json)}
                onMouseEnter={() => eventLogger.logFrontendEvent('tool-icon-hover', { tool: 'json' })}
            ></div>
            <div 
                className="tool-icon diff-tool" 
                onClick={handleToolClick('diff', diff)}
                onMouseEnter={() => eventLogger.logFrontendEvent('tool-icon-hover', { tool: 'diff' })}
            ></div>
            <div 
                className="tool-icon kafka-tool" 
                onClick={handleToolClick('kafka', kafka)}
                onMouseEnter={() => eventLogger.logFrontendEvent('tool-icon-hover', { tool: 'kafka' })}
            ></div>
            <div 
                className="tool-icon event-tool" 
                onClick={handleToolClick('events', events)}
                onMouseEnter={() => eventLogger.logFrontendEvent('tool-icon-hover', { tool: 'events' })}
                title="事件日志查看器"
            >📊</div>
        </div>
        <div className="right-bar-container"></div>
        <div className="top-bar-container"></div>
        <div className="bottom-bar-container"></div>
        <div className="content-container">{tool}</div>
    </div>
}

export default Layout