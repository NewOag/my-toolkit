import "./KafkaTool.css"
import React, {useEffect, useRef} from 'react'
import {invoke} from '@tauri-apps/api'
import {Editor, EditorInstance} from '../../common/Editor/Editor.tsx'


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

    useEffect(() => {
        console.log("init")
    }, []);

    const metadata = async () => {
        if (!brokerRef.current || !topicRef.current || !editorRef.current) return
        const ts = await topics(brokerRef.current.value)
        editorRef.current.value = JSON.stringify(ts)
    }

    const send = async () => {
        if (!brokerRef.current || !topicRef.current || !editorRef.current) return
        await sendMessage(brokerRef.current.value, topicRef.current.value, editorRef.current.value)
    }

    const fetch = async () => {
        if (!brokerRef.current || !topicRef.current || !editorRef.current) return
        const ms = await fetchMessage(brokerRef.current.value, topicRef.current.value)
        editorRef.current.value = JSON.stringify(ms)
    }

    return <div className="container">
        <div className="topic-info">
            <div>
                <label htmlFor="broker">broker</label>
                <input id="broker" ref={brokerRef}/>
            </div>
            <div>
                <label htmlFor="topic">topic</label>
                <input id="topic" ref={topicRef}/>
            </div>
        </div>
        <div className="button-bar">
            <button onClick={metadata}>METADATA</button>
            <button onClick={send}>SEND</button>
            <button onClick={fetch}>FETCH</button>
        </div>
        <div className="message-container">
            <Editor ref={editorRef}/>
        </div>
    </div>
}

export default KafkaTool;