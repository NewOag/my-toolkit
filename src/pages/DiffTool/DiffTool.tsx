import './DiffTool.less'
import React, {useRef, useState} from 'react'
import {DiffEditor, DiffEditorInstance} from '../../common/Editor/Editor.tsx'
import {invoke} from '@tauri-apps/api/core'
import { eventLogger } from '../../utils/EventLogger'

function generate(handler: string) {
    return async function (str: string): Promise<string> {
        return await invoke(handler, {str})
    }
}

const handlers = ['format', 'recur_format', 'compress', 'stringify', 'parse', 'sort_format']
const [format, recurFormat, compress, stringify, parse, sortFormat] = handlers.map(handler => generate(handler))

const DiffTool: React.FC<any> = () => {
    const editorRef = useRef<DiffEditorInstance>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [lastOperation, setLastOperation] = useState<string>('')
    const [operationStatus, setOperationStatus] = useState<'success' | 'error' | 'idle'>('idle')

    const getLeftValue = () => {
        if (editorRef.current) {
            return editorRef.current.left.value
        }
        return ""
    }

    const getRightValue = () => {
        if (editorRef.current) {
            return editorRef.current.right.value
        }
        return ""
    }

    const setLeftValue = (str: string) => {
        if (editorRef.current) {
            editorRef.current.left.value = str
            return
        }
        console.error("DiffTool setLeftValue failed: str=", str)
    }

    const setRightValue = (str: string) => {
        if (editorRef.current) {
            editorRef.current.right.value = str
            return
        }
        console.error("DiffTool setRightValue failed: str=", str)
    }

    // 创建带事件记录和状态管理的处理函数
    const createDiffHandler = (handlerName: string, handler: (str: string) => Promise<string>) => {
        return async () => {
            const startTime = Date.now();
            const leftValue = getLeftValue();
            const rightValue = getRightValue();
            
            setIsProcessing(true);
            setLastOperation(handlerName);
            setOperationStatus('idle');
            
            eventLogger.logFrontendEvent('diff-operation-start', {
                operation: handlerName,
                leftLength: leftValue.length,
                rightLength: rightValue.length,
                timestamp: new Date().toISOString()
            });

            try {
                const [leftResult, rightResult] = await Promise.all([
                    handler(leftValue),
                    handler(rightValue)
                ]);
                
                setLeftValue(leftResult);
                setRightValue(rightResult);
                
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                setOperationStatus('success');
                
                eventLogger.logFrontendEvent('diff-operation-success', {
                    operation: handlerName,
                    duration,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                setOperationStatus('error');
                
                eventLogger.logFrontendEvent('diff-operation-error', {
                    operation: handlerName,
                    error: error?.toString(),
                    duration,
                    timestamp: new Date().toISOString()
                });
                
                console.error(`DiffTool ${handlerName} failed:`, error);
            } finally {
                setIsProcessing(false);
                setTimeout(() => setOperationStatus('idle'), 3000);
            }
        }
    }

    const fn1 = createDiffHandler('format', format);
    const fn2 = createDiffHandler('recur_format', recurFormat);
    const fn3 = createDiffHandler('compress', compress);
    const fn4 = createDiffHandler('stringify', stringify);
    const fn5 = createDiffHandler('parse', parse);
    const fn6 = createDiffHandler('sort_format', sortFormat);

    // 清空编辑器
    const clearEditors = () => {
        setLeftValue('');
        setRightValue('');
        eventLogger.logFrontendEvent('diff-editors-cleared', {
            timestamp: new Date().toISOString()
        });
    };

    // 交换左右内容
    const swapContent = () => {
        const leftContent = getLeftValue();
        const rightContent = getRightValue();
        setLeftValue(rightContent);
        setRightValue(leftContent);
        eventLogger.logFrontendEvent('diff-content-swapped', {
            timestamp: new Date().toISOString()
        });
    };

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
    };

    return (
        <div className="tool-container">
            {/* 工具头部 */}
            <div className="tool-header">
                <h1 className="tool-title">
                    <span className="tool-icon" style={{background: '#4db656'}}>🔍</span>
                    对比工具
                </h1>
                <p className="tool-description">
                    JSON 对比工具，支持左右两侧同时编辑和对比，实时显示差异
                </p>
            </div>

            {/* 操作按钮区域 */}
            <div className="button-section">
                <div className="section-title">
                    批量操作
                    {getStatusIndicator()}
                </div>
                <div className="button-grid">
                    <button 
                        className="btn btn-primary"
                        onClick={fn1}
                        disabled={isProcessing}
                        title="同时格式化左右两侧的 JSON"
                    >
                        <span>🎨</span> 格式化
                    </button>
                    <button 
                        className="btn btn-info"
                        onClick={fn2}
                        disabled={isProcessing}
                        title="递归格式化左右两侧的 JSON"
                    >
                        <span>🔄</span> 高级格式化
                    </button>
                    <button 
                        className="btn btn-secondary"
                        onClick={fn3}
                        disabled={isProcessing}
                        title="压缩左右两侧的 JSON"
                    >
                        <span>📦</span> 压缩
                    </button>
                    <button 
                        className="btn btn-warning"
                        onClick={fn4}
                        disabled={isProcessing}
                        title="转义左右两侧的 JSON 字符串"
                    >
                        <span>🔒</span> 转义
                    </button>
                    <button 
                        className="btn btn-success"
                        onClick={fn5}
                        disabled={isProcessing}
                        title="解析左右两侧的转义字符串"
                    >
                        <span>🔓</span> 解析
                    </button>
                    <button 
                        className="btn btn-danger"
                        onClick={fn6}
                        disabled={isProcessing}
                        title="排序左右两侧的 JSON 对象"
                    >
                        <span>🔤</span> 排序
                    </button>
                </div>
            </div>

            {/* 编辑器控制区域 */}
            <div className="button-section">
                <div className="section-title">编辑器操作</div>
                <div className="button-row">
                    <button 
                        className="btn btn-secondary"
                        onClick={clearEditors}
                        title="清空左右两侧的内容"
                    >
                        <span>🗑️</span> 清空
                    </button>
                    <button 
                        className="btn btn-info"
                        onClick={swapContent}
                        title="交换左右两侧的内容"
                    >
                        <span>🔄</span> 交换
                    </button>
                </div>
            </div>

            {/* 差异编辑器区域 */}
            <div className="editor-section">
                <div className="section-title">
                    差异对比编辑器
                    <span className="editor-hint">左侧：原始内容 | 右侧：对比内容</span>
                </div>
                <div className="editor-container">
                    <DiffEditor ref={editorRef}/>
                </div>
            </div>
        </div>
    )
}

export default DiffTool