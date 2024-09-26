import React, {useEffect, useRef, useState} from 'react'
import {EditorState} from '@codemirror/state'
import {basicSetup, EditorView} from 'codemirror'
import {json, jsonParseLinter} from '@codemirror/lang-json'
import {linter} from '@codemirror/lint'
import "./Editor.css"

interface IEditor {
    doc?: string
    onChange?: (value: string) => void
}

const changeFacet = (onChange?: (value: string) => void) => EditorView.updateListener.of(update => {
    if (update.docChanged && onChange && update.transactions.some(tr => tr.isUserEvent("input"))) {
        onChange(update.state.doc.toString())
    }
});

export const Editor: React.FC<IEditor> = ({doc, onChange}) => {
    const containerRef = useRef(null)
    const [editorView, setEditorView] = useState<EditorView>()
    useEffect(() => {
        const state = EditorState.create({
            doc, extensions: [
                basicSetup, json(), linter(jsonParseLinter()),
                // todo format on user paste
                EditorState.transactionFilter.of(tr => {
                    console.debug("tr is ", tr)
                    return tr
                }),
                changeFacet(onChange),
                EditorView.theme({
                    "&.cm-focused": {
                        outline: "none"
                    },
                    ".cm-scroller": {
                        "scrollbar-width": "none"
                    }
                })
            ],
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

    return <div ref={containerRef} className="code-editor"/>
}