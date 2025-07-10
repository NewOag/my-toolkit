import "./KafkaTool.less"
import React, {useEffect, useRef, useState} from 'react'
import {Editor, EditorInstance} from '../../common/Editor/Editor.tsx'
import {invoke} from '@tauri-apps/api/core'
import { eventLogger } from '../../utils/EventLogger'

async function topics(hosts: string) {
    const metadata = await invoke("topics", {hosts})
    console.log(metadata)
    return metadata
}

async function sendMessage(hosts: string, topic: string, data: string) {
    await invoke("send_message", {hosts, topic, data})
}

async function fetchMessage(hosts: string, topic: string) {
    const messages = await invoke("fetch_message", {hosts, topic})
    console.log("messages is ", messages)
    return messages
}

const KafkaTool: React.FC = () => {
    const brokerRef = useRef<HTMLInputElement>(null)
    const topicRef = useRef<HTMLInputElement>(null)
    const editorRef = useRef<EditorInstance>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
    const [lastOperation, setLastOperation] = useState<string>('')

    useEffect(() => {
        console.log("Kafka Tool initialized")
        eventLogger.logFrontendEvent('kafka-tool-mounted', {
            timestamp: new Date().toISOString()
        });
    }, []);

    const createKafkaHandler = (operationName: string, handler: (...args: any[]) => Promise<any>) => {
        return async (...args: any[]) => {
            setIsProcessing(true);
            setLastOperation(operationName);
            setConnectionStatus('connecting');
            
            eventLogger.logFrontendEvent('kafka-operation-start', {
                operation: operationName,
                timestamp: new Date().toISOString(),
                broker: brokerRef.current?.value,
                topic: topicRef.current?.value
            });

            try {
                const result = await handler(...args);
                setConnectionStatus('connected');
                
                eventLogger.logFrontendEvent('kafka-operation-success', {
                    operation: operationName,
                    timestamp: new Date().toISOString()
                });
                
                return result;
            } catch (error) {
                setConnectionStatus('error');
                
                eventLogger.logFrontendEvent('kafka-operation-error', {
                    operation: operationName,
                    error: error?.toString(),
                    timestamp: new Date().toISOString()
                });
                
                throw error;
            } finally {
                setIsProcessing(false);
                // 5秒后重置状态
                setTimeout(() => setConnectionStatus('idle'), 5000);
            }
        };
    };

    const metadata = createKafkaHandler('topics', async () => {
        if (!brokerRef.current || !editorRef.current) return;
        const ts = await topics(brokerRef.current.value);
        editorRef.current.value = JSON.stringify(ts, null, 2);
    });

    const send = createKafkaHandler('send_message', async () => {
        if (!brokerRef.current || !topicRef.current || !editorRef.current) return;
        await sendMessage(brokerRef.current.value, topicRef.current.value, editorRef.current.value);
        // 显示发送成功消息
        const currentValue = editorRef.current.value;
        editorRef.current.value = `✅ 消息发送成功!\n\n原消息:\n${currentValue}`;
    });

    const fetch = createKafkaHandler('fetch_message', async () => {
        if (!brokerRef.current || !topicRef.current || !editorRef.current) return;
        const ms = await fetchMessage(brokerRef.current.value, topicRef.current.value);
        editorRef.current.value = JSON.stringify(ms, null, 2);
    });

    const getConnectionStatusIndicator = () => {
        const statusMap = {
            idle: null,
            connecting: <div className="status-indicator status-info">🔄 连接中...</div>,
            connected: <div className="status-indicator status-success">✅ 连接成功</div>,
            error: <div className="status-indicator status-error">❌ 连接失败</div>
        };
        return statusMap[connectionStatus];
    };

    const handleInputChange = (type: 'broker' | 'topic') => {
        eventLogger.logFrontendEvent('kafka-input-change', {
            type,
            timestamp: new Date().toISOString()
        });
    };

    return (
        <div className="tool-container">
            {/* 工具头部 */}
            <div className="tool-header">
                <h1 className="tool-title">
                    <span className="tool-icon" style={{background: '#b64d4d'}}>📨</span>
                    Kafka 工具
                </h1>
                <p className="tool-description">
                    Apache Kafka 消息队列管理工具，支持主题查询、消息发送和接收
                </p>
            </div>

            {/* 连接配置区域 */}
            <div className="input-section">
                <div className="section-title">
                    连接配置
                    {getConnectionStatusIndicator()}
                </div>
                <div className="input-row">
                    <div className="input-group">
                        <label htmlFor="broker">Broker 地址</label>
                        <input 
                            id="broker" 
                            ref={brokerRef}
                            placeholder="localhost:9092 或 host1:9092,host2:9092"
                            onChange={() => handleInputChange('broker')}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="topic">主题名称</label>
                        <input 
                            id="topic" 
                            ref={topicRef}
                            placeholder="输入 Kafka 主题名称"
                            onChange={() => handleInputChange('topic')}
                        />
                    </div>
                </div>
            </div>

            {/* 操作按钮区域 */}
            <div className="button-section">
                <div className="section-title">Kafka 操作</div>
                <div className="button-row">
                    <button 
                        className="btn btn-info"
                        onClick={metadata}
                        disabled={isProcessing}
                        title="获取 Kafka 集群的主题元数据信息"
                    >
                        <span>📋</span> 获取主题
                    </button>
                    <button 
                        className="btn btn-success"
                        onClick={send}
                        disabled={isProcessing}
                        title="向指定主题发送消息"
                    >
                        <span>📤</span> 发送消息
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={fetch}
                        disabled={isProcessing}
                        title="从指定主题拉取最新消息"
                    >
                        <span>📥</span> 拉取消息
                    </button>
                </div>
            </div>

            {/* 消息编辑器区域 */}
            <div className="editor-section">
                <div className="section-title">
                    消息内容
                    {lastOperation && (
                        <span className="operation-hint">
                            最后操作: {lastOperation}
                        </span>
                    )}
                </div>
                <div className="editor-container">
                    <Editor ref={editorRef}/>
                </div>
            </div>
        </div>
    )
}

export default KafkaTool;