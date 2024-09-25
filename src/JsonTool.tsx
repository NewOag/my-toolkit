import "./JsonTool.css";
import {Editor} from './Editor.tsx'
import {useEffect, useState} from 'react'
import {recurParseObj} from './utils/JsonUtil.ts'


function JsonTool() {
    const [doc, setDoc] = useState<string>()
    const [value, onChange] = useState<string>()

    useEffect(() => {
        onChange(doc)
    }, [doc])

    const fn1 = () => {
        const newDoc = JSON.stringify(JSON.parse(value!), null, 2)
        setDoc(newDoc)
    }

    const fn2 = () => {
        const obj = recurParseObj(value)
        if (typeof obj == "object") setDoc(JSON.stringify(obj, null, 2))
        else setDoc(obj)
    }

    const fn3 = () => {
        const newDoc = JSON.stringify(JSON.parse(value!))
        setDoc(newDoc)
    }

    const fn4 = () => {
        const newDoc = JSON.stringify(value)
        setDoc(newDoc)
    }

    const fn5 = () => {
        const newDoc = JSON.parse(value!)
        setDoc(newDoc)
    }

    return (
        <div id="container">
            <div className="button-container">
                <button onClick={fn1}>Format</button>
                <button onClick={fn2}>Format Pro</button>
                <button onClick={fn3}>Compress</button>
                <button onClick={fn4}>Escape</button>
                <button onClick={fn5}>Unescape</button>
                <button onClick={() => console.log("current value is ", value)}>Print</button>
            </div>
            <div className="editor-container">
                <Editor doc={doc} onChange={onChange}/>
            </div>
        </div>
    );
}

export default JsonTool;
