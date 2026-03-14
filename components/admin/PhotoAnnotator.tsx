'use client'
// components/admin/PhotoAnnotator.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AnnotatorProps {
  imageUrl: string
  imageIndex: number
  submissionId: string
  existingAnnotated?: string
  onSave: (annotatedUrl: string, originalUrl: string) => void
}

type Tool = 'arrow' | 'circle' | 'rect' | 'text' | 'freehand'

interface DrawItem {
  tool: Tool
  color: string
  size: number
  points: number[]
  text?: string
}

const COLORS = ['#FF4444', '#FFAA00', '#44FF88', '#4488FF', '#FF44FF', '#FFFFFF']
const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'freehand', label: 'Pincel', icon: '✏' },
  { id: 'arrow', label: 'Flecha', icon: '↗' },
  { id: 'circle', label: 'Círculo', icon: '○' },
  { id: 'rect', label: 'Rectángulo', icon: '□' },
  { id: 'text', label: 'Texto', icon: 'T' },
]

export function PhotoAnnotator({ imageUrl, imageIndex, submissionId, existingAnnotated, onSave }: AnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>('arrow')
  const [color, setColor] = useState('#FF4444')
  const [size, setSize] = useState(3)
  const [items, setItems] = useState<DrawItem[]>([])
  const [drawing, setDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const redraw = useCallback((extraItem?: DrawItem) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const allItems = extraItem ? [...items, extraItem] : items

    allItems.forEach(item => {
      ctx.strokeStyle = item.color
      ctx.fillStyle = item.color
      ctx.lineWidth = item.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const [x1, y1, x2, y2] = item.points

      if (item.tool === 'freehand') {
        ctx.beginPath()
        ctx.moveTo(item.points[0], item.points[1])
        for (let i = 2; i < item.points.length; i += 2) {
          ctx.lineTo(item.points[i], item.points[i + 1])
        }
        ctx.stroke()
      } else if (item.tool === 'arrow') {
        drawArrow(ctx, x1, y1, x2, y2, item.size)
      } else if (item.tool === 'circle') {
        const r = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        ctx.beginPath()
        ctx.arc(x1, y1, r, 0, Math.PI * 2)
        ctx.stroke()
      } else if (item.tool === 'rect') {
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      } else if (item.tool === 'text' && item.text) {
        ctx.font = `${item.size * 6}px Lato, sans-serif`
        ctx.fillText(item.text, x1, y1)
      }
    })
  }, [items])

  function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, size: number) {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const len = 14 + size * 2

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - len * Math.cos(angle - 0.4), y2 - len * Math.sin(angle - 0.4))
    ctx.lineTo(x2 - len * Math.cos(angle + 0.4), y2 - len * Math.sin(angle + 0.4))
    ctx.closePath()
    ctx.fill()
  }

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      redraw()
    }
  }, [imageUrl])

  useEffect(() => { redraw() }, [items, redraw])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'text') {
      const pos = getPos(e)
      const text = window.prompt('Escribe tu anotación:')
      if (text) {
        setItems(prev => [...prev, { tool: 'text', color, size, points: [pos.x, pos.y, pos.x, pos.y], text }])
      }
      return
    }
    const pos = getPos(e)
    setStartPos(pos)
    setDrawing(true)
    if (activeTool === 'freehand') {
      setCurrentPoints([pos.x, pos.y])
    }
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    const pos = getPos(e)
    if (activeTool === 'freehand') {
      const updated = [...currentPoints, pos.x, pos.y]
      setCurrentPoints(updated)
      redraw({ tool: 'freehand', color, size, points: updated })
    } else {
      redraw({ tool: activeTool, color, size, points: [startPos.x, startPos.y, pos.x, pos.y] })
    }
  }

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    setDrawing(false)
    const pos = getPos(e)
    const newItem: DrawItem = activeTool === 'freehand'
      ? { tool: 'freehand', color, size, points: currentPoints }
      : { tool: activeTool, color, size, points: [startPos.x, startPos.y, pos.x, pos.y] }
    setItems(prev => [...prev, newItem])
    setCurrentPoints([])
  }

  const undo = () => setItems(prev => prev.slice(0, -1))
  const reset = () => setItems([])

  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setSaving(true)

    canvas.toBlob(async (blob) => {
      if (!blob) { setSaving(false); return }
      const path = `admin/${submissionId}/annotated-${imageIndex}-${Date.now()}.jpg`
      const { error } = await supabase.storage.from('submissions').upload(path, blob, {
        contentType: 'image/jpeg', upsert: true,
      })
      if (error) { console.error(error); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('submissions').getPublicUrl(path)
      onSave(publicUrl, imageUrl)
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="annotator">
      {/* Toolbar */}
      <div className="ann-toolbar">
        <div className="tools-group">
          {TOOLS.map(t => (
            <button
              key={t.id}
              className={`tool-btn ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => setActiveTool(t.id)}
              title={t.label}
              type="button"
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="separator" />

        <div className="colors-group">
          {COLORS.map(c => (
            <button
              key={c}
              className={`color-btn ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              type="button"
            />
          ))}
        </div>

        <div className="separator" />

        <div className="size-group">
          <span className="size-label">Grosor</span>
          <input
            type="range" min={1} max={8} value={size}
            onChange={e => setSize(Number(e.target.value))}
            className="size-range"
          />
          <span className="size-value">{size}</span>
        </div>

        <div className="separator" />

        <div className="actions-group">
          <button className="action-btn" onClick={undo} type="button" title="Deshacer">↩</button>
          <button className="action-btn" onClick={reset} type="button" title="Borrar todo">✕</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { if (drawing) onMouseUp({} as any) }}
          className={`ann-canvas cursor-${activeTool}`}
        />
      </div>

      {/* Save */}
      <div className="ann-footer">
        <button
          className={`save-ann-btn ${saving ? 'loading' : ''} ${saved ? 'success' : ''}`}
          onClick={handleSave}
          disabled={saving || items.length === 0}
          type="button"
        >
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : '↓ Guardar anotación'}
        </button>
        {items.length > 0 && (
          <span className="ann-count">{items.length} elemento{items.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <style jsx>{`
        .annotator {
          background: #0D0A06; border-radius: 8px;
          border: 1px solid rgba(196,151,90,0.2);
          overflow: hidden;
        }
        .ann-toolbar {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; background: #1A1208;
          border-bottom: 1px solid rgba(196,151,90,0.15);
          flex-wrap: wrap;
        }
        .tools-group, .colors-group, .actions-group {
          display: flex; align-items: center; gap: 4px;
        }
        .tool-btn {
          width: 34px; height: 34px; border: 1px solid rgba(196,151,90,0.2);
          background: transparent; color: #C4975A;
          border-radius: 6px; cursor: pointer; font-size: 15px;
          transition: all 0.15s; display: flex; align-items: center; justify-content: center;
        }
        .tool-btn:hover { background: rgba(196,151,90,0.12); }
        .tool-btn.active { background: rgba(196,151,90,0.2); border-color: #C4975A; }
        .color-btn {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid transparent; cursor: pointer;
          transition: all 0.15s; padding: 0;
        }
        .color-btn.active { border-color: #FDF6EC; transform: scale(1.25); }
        .separator {
          width: 1px; height: 28px;
          background: rgba(196,151,90,0.15); flex-shrink: 0;
        }
        .size-group {
          display: flex; align-items: center; gap: 6px;
        }
        .size-label, .size-value {
          font-size: 11px; color: rgba(196,151,90,0.6);
          font-family: 'Lato', sans-serif;
        }
        .size-range {
          width: 70px; accent-color: #C4975A; cursor: pointer;
        }
        .action-btn {
          width: 34px; height: 34px; border: 1px solid rgba(196,151,90,0.2);
          background: transparent; color: rgba(253,246,236,0.5);
          border-radius: 6px; cursor: pointer; font-size: 15px;
          transition: all 0.15s;
        }
        .action-btn:hover { background: rgba(232,139,106,0.1); color: #E88B6A; }
        .canvas-wrapper {
          overflow: auto; max-height: 80vh;
          cursor: crosshair;
        }
        .ann-canvas {
          display: block; width: 100%; height: auto;
        }git diff components\admin\PhotoAnnotator.tsx
        .ann-footer {
          padding: 12px 16px; background: #1A1208;
          border-top: 1px solid rgba(196,151,90,0.15);
          display: flex; align-items: center; gap: 12px;
        }
        .save-ann-btn {
          padding: 9px 20px; background: #C4975A; color: #1A1208;
          border: none; border-radius: 4px;
          font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;
          font-family: 'Lato', sans-serif; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        .save-ann-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .save-ann-btn.success { background: rgba(100,120,80,0.3); color: #8BAF70; }
        .ann-count {
          font-size: 12px; color: rgba(196,151,90,0.5);
          font-family: 'Lato', sans-serif;
        }
      `}</style>
    </div>
  )
}