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
        return o
    }
    if (Array.isArray(json)) {
        for (let i = 0; i < json.length; i++) {
            json[i] = jsonify(json[i])
        }
        return json
    } else {
        for (const key in json) {
            // @ts-ignore
            json[key] = jsonify(json[key])
        }
        return json
    }
}

function App() {
    const [doc, setDoc] = useState<string>("")
    const style = {
        height: "100vh",
        width: "100vw"
    }
    useEffect(() => {
        setDoc(`{"key": "value"}`)
    }, [])

    const fn1 = () => {
        console.log(doc)
        setDoc(JSON.stringify(JSON.parse(doc!), null, 4))
        console.log(doc)
    }

    const fn2 = () => {
        console.log(doc)
        setDoc(JSON.stringify(jsonify(doc), null, 4))
        console.log(doc)
    }

    return (
        <div style={style}>
            <br/>
            <div>
                <button onClick={fn1}>格式化</button>
                <button onClick={fn2}>如意如意，随我心意，快快显灵</button>
            </div>
            <br/>
            <Editor doc={doc}/>
        </div>
    );
}

export default App;
