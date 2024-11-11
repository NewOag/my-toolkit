import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react'
import {EditorState} from '@codemirror/state'
import {basicSetup, EditorView} from 'codemirror'
import {json, jsonParseLinter} from '@codemirror/lang-json'
import {codeFolding, unfoldEffect} from '@codemirror/language'
import {linter} from '@codemirror/lint'
import './Editor.less'

export interface EditorInstance {
    get value(): string;

    set value(v: string);
}

export interface IEditor {
    value?: string
    onChange?: (value: string) => void
}

const changeFacet = (onChange?: (value: string) => void) => EditorView.updateListener.of(update => {
    if (update.docChanged && onChange && update.transactions.some(tr => tr.isUserEvent("input"))) {
        onChange(update.state.doc.toString())
    }
});

const foldConfig = {
    placeholderDOM(_view: EditorView, _onclick: (event: Event) => void, prepared: any) {
        const [text, from, to] = prepared
        const span = document.createElement('span')
        span.innerText = ` // ${text && text} items `
        span.className = 'cm-holder'
        span.onclick = (_e) => {
            _view.dispatch({effects: unfoldEffect.of({from, to})})
        }
        return prepared && span || null
    },
    preparePlaceholder(state: EditorState, range: { from: number, to: number }) {
        const foldDoc = state.sliceDoc(range.from - 1, range.to + 1)
        try {
            const value = JSON.parse(foldDoc)
            if (typeof value === 'object') {
                return [Object.keys(value).length, range.from, range.to]
            }
        } catch (e) {
            console.error('preparePlaceholder func error', state, range, e)
        }
        return [null, range.from, range.to]
    }
}

const Editor0: React.ForwardRefRenderFunction<EditorInstance, IEditor> = ({value, onChange}, ref) => {
    const containerRef = useRef(null)
    const [editorView, setEditorView] = useState<EditorView>()
    useEffect(() => {
        const state = EditorState.create({
            doc: value, extensions: [
                basicSetup, json(), linter(jsonParseLinter()), changeFacet(onChange),
                codeFolding(foldConfig),
                // todo format on user paste
                EditorState.transactionFilter.of(tr => {
                    console.debug("tr is ", tr)
                    return tr
                }),
                EditorView.theme({
                    ".cm-holder": {
                        color: '#20202050',
                        'font-style': 'italic'
                    },
                    ".cm-holder:hover": {
                        cursor: 'pointer'
                    },
                    "&.cm-focused": {
                        outline: "none"
                    },
                    ".cm-scroller": {
                        "scrollbar-width": "none"
                    },
                    ".cm-scroller::-webkit-scrollbar": {
                        width: 0,
                        height: 0
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

    const changeValue = (str: string) => {
        editorView?.dispatch({
            changes: {
                from: 0,
                to: editorView?.state.doc.length,
                insert: str
            }
        })
    }

    const editor: EditorInstance = new class implements EditorInstance {
        get value(): string {
            return editorView?.state.doc.toString()!
        }

        set value(str) {
            changeValue(str)
        }
    }
    useImperativeHandle(ref, () => editor)

    return <div ref={containerRef} className="code-editor"/>
}

export const Editor = forwardRef(Editor0)