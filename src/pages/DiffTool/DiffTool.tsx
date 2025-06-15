import './DiffTool.less'
import React, {useRef} from 'react'
import {DiffEditor, DiffEditorInstance} from '../../common/Editor/Editor.tsx'
import {invoke} from '@tauri-apps/api/core'

function generate(handler: string) {
    return async function (str: string): Promise<string> {
        return await invoke(handler, {str})
    }
}

const handlers = ['format', 'recur_format', 'compress', 'stringify', 'parse', 'sort_format']
const [format, recurFormat, compress, stringify, parse, sortFormat] = handlers.map(handler => generate(handler))

const DiffTool: React.FC<any> = () => {
    const editorRef = useRef<DiffEditorInstance>(null)

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
        console.error("JsonTool setValue failed: str=", str)
    }

    const setRightValue = (str: string) => {
        if (editorRef.current) {
            editorRef.current.right.value = str
            return
        }
        console.error("JsonTool setValue failed: str=", str)
    }

    const fn1 = async () => {
        setLeftValue(await format(getLeftValue()))
        setRightValue(await format(getRightValue()))
    }

    const fn2 = async () => {
        setLeftValue(await recurFormat(getLeftValue()))
        setRightValue(await recurFormat(getRightValue()))
    }

    const fn3 = async () => {
        setLeftValue(await compress(getLeftValue()))
        setRightValue(await compress(getRightValue()))
    }

    const fn4 = async () => {
        setLeftValue(await stringify(getLeftValue()))
        setRightValue(await stringify(getRightValue()))
    }

    const fn5 = async () => {
        setLeftValue(await parse(getLeftValue()))
        setRightValue(await parse(getRightValue()))
    }

    const fn6 = async () => {
        setLeftValue(await sortFormat(getLeftValue()))
        setRightValue(await sortFormat(getRightValue()))
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
                <DiffEditor ref={editorRef}/>
            </div>
        </div>
    )
}

export default DiffTool