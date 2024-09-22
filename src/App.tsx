import "./App.css";
import {Editor} from './Editor.tsx'
import {useEffect, useState} from 'react'

function jsonify(o: any) {
    let json = {}
    if (typeof o === 'string') {
        try {
            json = JSON.parse(o)
            if (json !== o) {
                json = jsonify(json)
            }
        } catch (e) {
            return o
        }
    } else if (typeof o === 'object' && o !== null) {
        json = o
    } else {
        return JSON.stringify(o, null, 2)
    }
    if (Array.isArray(json)) {
        for (let i = 0; i < json.length; i++) {
            json[i] = jsonify(json[i])
        }
        return JSON.stringify(json, null, 2)
    } else {
        for (const key in json) {
            // @ts-ignore
            json[key] = jsonify(json[key])
        }
        return JSON.stringify(json, null, 2)
    }
}

function App() {
    const [doc, setDoc] = useState<string>("")
    const [value, onChange] = useState<string>()
    const style = {
        height: "100vh",
        width: "100vw",
    }
    useEffect(() => {
        const defaultValue = `{"key": "value"}`
        setDoc(defaultValue)
        onChange(defaultValue)
    }, [])

    useEffect(() => {
        onChange(doc)
    }, [doc])

    const fn1 = () => {
        console.log(value)
        try {
            const newDoc = JSON.stringify(JSON.parse(value!), null, 2)
            setDoc(newDoc)
        } catch (_) {}
        console.log(value)
    }

    const fn2 = () => {
        console.log(value)
        try {
            const newDoc = jsonify(value!)
            setDoc(newDoc)
        } catch (_) {}
        console.log(value)
    }

    return (
        <div style={style}>
            <br/>
            <div style={{display: "flex", justifyContent: "center"}}>
                <button onClick={fn1}>格式化</button>
                <button onClick={fn2}>如意如意，随我心意，快快显灵</button>
                <button onClick={() => console.log("current value is ", value)}>输出</button>
            </div>
            <br/>
            <Editor doc={doc} onChange={onChange}/>
        </div>
    );
}

export default App;
