import "./JsonTool.css";
import {Editor, EditorInstance} from '../../common/Editor/Editor.tsx'
import React, {useRef} from 'react'

import {invoke} from '@tauri-apps/api'

async function format(str: string): Promise<string> {
    return await invoke('format', {str})
}

async function recurFormat(str: string): Promise<string> {
    return await invoke('recur_format', {str})
}

async function compress(str: string): Promise<string> {
    return await invoke('compress', {str})
}

const JsonTool: React.FC = () => {
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

    const fn1 = async () => {
        setValue(await format(getValue()))
    }

    const fn2 = async () => {
        // const obj = recurParseObj(getValue())
        // if (typeof obj == "object") setValue(JSON.stringify(obj, null, 2))
        // else setValue(obj)
        setValue(await recurFormat(getValue()))
    }

    const fn3 = async () => {
        // const newValue = JSON.stringify(JSON.parse(getValue()))
        // setValue(newValue)
        setValue(await compress(getValue()))
    }

    const fn4 = () => {
        const newValue = JSON.stringify(getValue())
        setValue(newValue)
    }

    const fn5 = () => {
        const newValue = JSON.parse(getValue())
        setValue(newValue)
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
            </div>
            <div className="editor-container">
                <Editor ref={editorRef}/>
            </div>
        </div>
    );
}

export default JsonTool;
