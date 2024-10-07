import "./JsonTool.css";
import {Editor, EditorInstance} from '../../common/Editor/Editor.tsx'
import {useRef} from 'react'
import {recurParseObj} from '../../utils/JsonUtil.ts'
import JSON5 from "json5"
import {invoke} from '@tauri-apps/api'

async function topics() {
    const metadata = await invoke("topics", {hosts: "localhost:9092"})
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

function JsonTool() {
    const editorRef = useRef<EditorInstance>(null)

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

    const fn1 = () => {
        const newValue = JSON.stringify(JSON5.parse(getValue()), null, 2)
        setValue(newValue)
    }

    const fn2 = () => {
        const obj = recurParseObj(getValue())
        if (typeof obj == "object") setValue(JSON.stringify(obj, null, 2))
        else setValue(obj)
    }

    const fn3 = () => {
        const newValue = JSON.stringify(JSON.parse(getValue()))
        setValue(newValue)
    }

    const fn4 = () => {
        const newValue = JSON.stringify(getValue())
        setValue(newValue)
    }

    const fn5 = () => {
        const newValue = JSON.parse(getValue())
        setValue(newValue)
    }

    const fn6 = async () => {
        if (editorRef.current?.value) {
            await sendMessage("localhost:9092", "my-topic", editorRef.current.value)
        }
    }

    const fn7 = async () => {
        const messages = await fetchMessage("localhost:9092", "my-topic")
        if (editorRef.current) editorRef.current.value = JSON.stringify(messages)
    }

    return (
        <div id="container">
            <div className="button-container">
                <button onClick={fn1}>Format</button>
                <button onClick={fn2}>Format Pro</button>
                <button onClick={fn3}>Compress</button>
                <button onClick={fn4}>Escape</button>
                <button onClick={fn5}>Unescape</button>
                <button onClick={() => console.log(editorRef.current?.value)}>Print</button>
                <button onClick={topics}>Topics</button>
                <button onClick={fn6}>SendMessage</button>
                <button onClick={fn7}>FetchMessage</button>
            </div>
            <div className="editor-container">
                <Editor ref={editorRef}/>
            </div>
        </div>
    );
}

export default JsonTool;
