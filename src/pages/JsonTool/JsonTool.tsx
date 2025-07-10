import "./JsonTool.less";
import {Editor, EditorInstance} from '../../common/Editor/Editor.tsx'
import React, {useRef, useState} from 'react'
import {invoke} from '@tauri-apps/api/core'
import { eventLogger } from '../../utils/EventLogger'

function generate(handler: string) {
    return async function (str: string): Promise<string> {
        return await invoke(handler, {str})
    }
}

const handlers = ['format', 'recur_format', 'compress', 'stringify', 'parse', 'sort_format']
const [format, recurFormat, compress, stringify, parse, sortFormat] = handlers.map(handler => generate(handler))

const JsonTool: React.FC = () => {
    const editorRef = useRef<EditorInstance>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [lastOperation, setLastOperation] = useState<string>('')
    const [operationStatus, setOperationStatus] = useState<'success' | 'error' | 'idle'>('idle')

    const getValue = () => {
        if (editorRef.current) {
            return editorRef.current.value
        }
        return ""
    }

    const setValue = (str: string) => {
        if (editorRef.current) {
            editorRef.current.value = str
            return
        }
        console.error("JsonTool setValue failed: str=", str)
    }

    // 创建带事件记录和状态管理的处理函数
    const createHandler = (handlerName: string, handler: (str: string) => Promise<string>) => {
        return async () => {
            const startTime = Date.now();
            const inputValue = getValue();
            
            setIsProcessing(true);
            setLastOperation(handlerName);
            setOperationStatus('idle');
            
            // 记录操作开始事件
            eventLogger.logFrontendEvent('json-operation-start', {
                operation: handlerName,
                inputLength: inputValue.length,
                timestamp: new Date().toISOString()
            });

            try {
                const result = await handler(inputValue);
                setValue(result);
                
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                setOperationStatus('success');
                
                // 记录操作成功事件
                eventLogger.logFrontendEvent('json-operation-success', {
                    operation: handlerName,
                    inputLength: inputValue.length,
                    outputLength: result.length,
                    duration,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                setOperationStatus('error');
                
                // 记录操作失败事件
                eventLogger.logFrontendEvent('json-operation-error', {
                    operation: handlerName,
                    inputLength: inputValue.length,
                    error: error?.toString(),
                    duration,
                    timestamp: new Date().toISOString()
                });
                
                console.error(`JsonTool ${handlerName} failed:`, error);
            } finally {
                setIsProcessing(false);
                // 3秒后清除状态
                setTimeout(() => setOperationStatus('idle'), 3000);
            }
        }
    }

    const fn1 = createHandler('format', format);
    const fn2 = createHandler('recur_format', recurFormat);
    const fn3 = createHandler('compress', compress);
    const fn4 = createHandler('stringify', stringify);
    const fn5 = createHandler('parse', parse);
    const fn6 = createHandler('sort_format', sortFormat);

    // 记录按钮悬停事件
    const handleButtonHover = (operation: string) => {
        eventLogger.logFrontendEvent('json-button-hover', {
            operation,
            timestamp: new Date().toISOString()
        });
    }

    // 获取状态指示器
    const getStatusIndicator = () => {
        if (operationStatus === 'idle') return null;
        
        return (
            <div className={`status-indicator status-${operationStatus}`}>
                {operationStatus === 'success' && '✓ 操作成功'}
                {operationStatus === 'error' && '✗ 操作失败'}
                {lastOperation && ` - ${lastOperation}`}
            </div>
        );
    }

    return (
        <div className="tool-container">
            {/* 工具头部 */}
            <div className="tool-header">
                <h1 className="tool-title">
                    <span className="tool-icon" style={{background: '#5bbec3'}}>{ }</span>
                    JSON 工具
                </h1>
                <p className="tool-description">
                    强大的 JSON 处理工具，支持格式化、压缩、转义、排序等操作
                </p>
            </div>

            {/* 按钮操作区域 */}
            <div className="button-section">
                <div className="section-title">
                    操作选项
                    {getStatusIndicator()}
                </div>
                <div className="button-grid">
                    <button 
                        className="btn btn-primary"
                        onClick={fn1}
                        onMouseEnter={() => handleButtonHover('format')}
                        disabled={isProcessing}
                        title="格式化 JSON，使其更易读"
                    >
                        <span>🎨</span> 格式化
                    </button>
                    <button 
                        className="btn btn-info"
                        onClick={fn2}
                        onMouseEnter={() => handleButtonHover('recur_format')}
                        disabled={isProcessing}
                        title="递归格式化，处理嵌套的 JSON 字符串"
                    >
                        <span>🔄</span> 高级格式化
                    </button>
                    <button 
                        className="btn btn-secondary"
                        onClick={fn3}
                        onMouseEnter={() => handleButtonHover('compress')}
                        disabled={isProcessing}
                        title="压缩 JSON，移除空格和换行"
                    >
                        <span>📦</span> 压缩
                    </button>
                    <button 
                        className="btn btn-warning"
                        onClick={fn4}
                        onMouseEnter={() => handleButtonHover('stringify')}
                        disabled={isProcessing}
                        title="转义 JSON 字符串"
                    >
                        <span>🔒</span> 转义
                    </button>
                    <button 
                        className="btn btn-success"
                        onClick={fn5}
                        onMouseEnter={() => handleButtonHover('parse')}
                        disabled={isProcessing}
                        title="解析转义的 JSON 字符串"
                    >
                        <span>🔓</span> 解析
                    </button>
                    <button 
                        className="btn btn-danger"
                        onClick={fn6}
                        onMouseEnter={() => handleButtonHover('sort_format')}
                        disabled={isProcessing}
                        title="按键名排序 JSON 对象"
                    >
                        <span>🔤</span> 排序
                    </button>
                </div>
            </div>

            {/* 编辑器区域 */}
            <div className="editor-section">
                <div className="section-title">JSON 编辑器</div>
                <div className="editor-container">
                    <Editor ref={editorRef}/>
                </div>
            </div>
        </div>
    );
}

export default JsonTool;
