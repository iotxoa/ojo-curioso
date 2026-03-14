'use client'
// components/lesson/RichTextEditor.tsx
import { useRef, useCallback, useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const TOOLBAR_BUTTONS = [
  { cmd: 'bold', icon: 'B', style: 'font-weight:800', title: 'Negrita' },
  { cmd: 'italic', icon: 'I', style: 'font-style:italic', title: 'Cursiva' },
  { cmd: 'underline', icon: 'U', style: 'text-decoration:underline', title: 'Subrayado' },
  { cmd: 'insertUnorderedList', icon: '≡', style: '', title: 'Lista' },
]

export function RichTextEditor({ value, onChange, placeholder = 'Escribe aquí...', minHeight = 180 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, []) // Solo al montar

  const execCmd = useCallback((cmd: string) => {
    document.execCommand(cmd, false)
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }, [onChange])

  const handleInput = useCallback(() => {
    if (!isComposing.current) {
      onChange(editorRef.current?.innerHTML || '')
    }
  }, [onChange])

  return (
    <div className="rich-editor-wrapper">
      {/* Toolbar */}
      <div className="rich-toolbar">
        {TOOLBAR_BUTTONS.map(btn => (
          <button
            key={btn.cmd}
            type="button"
            title={btn.title}
            onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd) }}
            className="toolbar-btn"
          >
            <span style={btn.style ? Object.fromEntries(btn.style.split(';').filter(Boolean).map(s => {
              const [k, v] = s.split(':')
              return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.trim()]
            })) as React.CSSProperties : {}}>
              {btn.icon}
            </span>
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={() => { isComposing.current = true }}
        onCompositionEnd={() => {
          isComposing.current = false
          onChange(editorRef.current?.innerHTML || '')
        }}
        data-placeholder={placeholder}
        className="rich-editor-body"
        style={{ minHeight }}
      />

      <style jsx>{`
        .rich-editor-wrapper {
          border: 1px solid rgba(196, 151, 90, 0.3);
          border-radius: 6px;
          overflow: hidden;
          background: #1A1208;
        }
        .rich-toolbar {
          display: flex;
          gap: 2px;
          padding: 8px 10px;
          border-bottom: 1px solid rgba(196, 151, 90, 0.2);
          background: rgba(42, 31, 16, 0.8);
        }
        .toolbar-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: #C4975A;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .toolbar-btn:hover {
          background: rgba(196, 151, 90, 0.15);
        }
        .rich-editor-body {
          padding: 16px 18px;
          color: #FDF6EC;
          font-family: 'Lato', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          outline: none;
        }
        .rich-editor-body:empty::before {
          content: attr(data-placeholder);
          color: rgba(253, 246, 236, 0.3);
          pointer-events: none;
        }
        .rich-editor-body ul {
          padding-left: 20px;
        }
        .rich-editor-body li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  )
}
