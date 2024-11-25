import "./JsonTool.less";
import {Editor, EditorInstance} from '../../common/Editor/Editor.tsx'
import React, {useRef} from 'react'

import {invoke} from '@tauri-apps/api'

function generate(handler: string) {
    return async function (str: string): Promise<string> {
        return await invoke(handler, {str})
    }
}

const handlers = ['format', 'recur_format', 'compress', 'stringify', 'parse', 'sort_format']
const [format, recurFormat, compress, stringify, parse, sortFormat] = handlers.map(handler => generate(handler))

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
        setValue(await recurFormat(getValue()))
    }

    const fn3 = async () => {
        setValue(await compress(getValue()))
    }

    const fn4 = async () => {
        setValue(await stringify(getValue()))
    }

    const fn5 = async () => {
        setValue(await parse(getValue()))
    }

    const fn6 = async () => {
        setValue(await sortFormat(getValue()))
    }

    return (
        <div id="container">
            <div className="button-container">
                <button onClick={fn1}>Format</button>
                <button onClick={fn2}>Format Pro</button>
                <button onClick={fn3}>Compress</button>
                <button onClick={fn4}>Escape</button>
                <button onClick={fn5}>Unescape</button>
                <button onClick={fn6}>Sort</button>
            </div>
            <div className="editor-container">
                <Editor ref={editorRef}/>
            </div>
        </div>
    );
}

export default JsonTool;
