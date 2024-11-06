import "./Layout.less"
import React, {useState} from 'react'
import JsonTool from '../JsonTool/JsonTool.tsx'
import KafkaTool from '../KafkaTool/KafkaTool.tsx'

interface ILayout {

}

const json = <JsonTool/>
const kafka = <KafkaTool/>


const Layout: React.FC<ILayout> = ({}) => {
    const [tool, setTool] = useState<React.ReactElement>(json)

    const changeTool = (nextTool: React.ReactElement) => {
        return () => {
            setTool(nextTool)
        }
    }

    return <div className="layout-container">
        <div className="left-bar-container">
            <div className="tool-icon json-icon" onClick={changeTool(json)}></div>
            <div className="tool-icon kafka-icon" onClick={changeTool(kafka)}></div>
        </div>
        <div className="right-bar-container"></div>
        <div className="top-bar-container"></div>
        <div className="bottom-bar-container"></div>
        <div className="content-container">{tool}</div>
    </div>
}

export default Layout