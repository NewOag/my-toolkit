import React, {useEffect, useRef, useState} from 'react'
import {EditorState} from '@codemirror/state'
import {basicSetup, EditorView} from 'codemirror'
import {json} from '@codemirror/lang-json'

interface IEditor {
    doc: string
}

export const Editor: React.FC<IEditor> = ({doc}) => {
    const containerRef = useRef(null)
    const [editorView, setEditorView] = useState<EditorView>()
    useEffect(() => {
        const state = EditorState.create({
            doc, extensions: [basicSetup, json()]
        })
        const view = new EditorView({
            state, parent: containerRef.current!
        })
        setEditorView(view)
        return () => view.destroy()
    }, [])

    useEffect(() => {
        let insert = doc
        if (typeof doc !== 'string') {
            insert = JSON.stringify(doc)
        }
        editorView?.dispatch({
            changes: {
                from: 0,
                to: editorView?.state.doc.length,
                insert
            }
        })
    }, [doc])

    return <div ref={containerRef}/>
}