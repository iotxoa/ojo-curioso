'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Save, Eye, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'

// ─── Tipos de bloque editables ────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: 'intro', label: 'Introducción' },
  { type: 'paragraph', label: 'Párrafo' },
  { type: 'section_title', label: 'Título de sección' },
  { type: 'highlight', label: 'Destacado' },
  { type: 'quote', label: 'Cita' },
  { type: 'fact', label: 'Dato curioso' },
  { type: 'hero', label: 'Hero (imagen grande)' },
  { type: 'image', label: 'Imagen' },
  { type: 'video', label: 'Vídeo' },
  { type: 'author', label: 'Autor' },
  { type: 'case_study', label: 'Estudio de caso' },
  { type: 'divider', label: 'Separador' },
]

const DEFAULT_BLOCK: Record<string, any> = {
  intro: { type: 'intro', text: '' },
  paragraph: { type: 'paragraph', text: '' },
  section_title: { type: 'section_title', text: '' },
  highlight: { type: 'highlight', author: '', text: '' },
  quote: { type: 'quote', text: '', author: '' },
  fact: { type: 'fact', label: '', text: '' },
  hero: { type: 'hero', src: '', alt: '', caption: '', credit: '' },
  image: { type: 'image', src: '', alt: '', caption: '', credit: '', size: 'medium' },
  video: { type: 'video', src: '', title: '', description: '' },
  author: { type: 'author', name: '', years: '', src: '', text: '', text2: '', quote: '' },
  case_study: { type: 'case_study', title: '', src: '', text: '', text2: '' },
  divider: { type: 'divider' },
}

// ─── Editor de campo de texto ────────────────────────────────────────────────
function TextField({ label, value, onChange, multiline = false, mono = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; mono?: boolean
}) {
  const style: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '0.5px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontFamily: mono ? 'monospace' : 'var(--font-sans)',
    fontSize: '0.875rem',
    padding: '0.6rem 0.8rem',
    outline: 'none',
    resize: multiline ? 'vertical' : 'none',
    lineHeight: 1.6,
    minHeight: multiline ? '80px' : undefined,
  }
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{label}</p>
      {multiline
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} style={style} />
        : <input value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...style, minHeight: undefined }} />
      }
    </div>
  )
}

// ─── Editor por tipo de bloque ───────────────────────────────────────────────
function BlockEditor({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const set = (key: string, value: any) => onChange({ ...block, [key]: value })

  switch (block.type) {
    case 'intro':
    case 'paragraph':
      return <TextField label="Texto" value={block.text} onChange={v => set('text', v)} multiline />

    case 'section_title':
      return <TextField label="Título" value={block.text} onChange={v => set('text', v)} />

    case 'highlight':
      return <>
        <TextField label="Autor / fuente" value={block.author} onChange={v => set('author', v)} />
        <TextField label="Año (opcional)" value={block.year} onChange={v => set('year', v)} />
        <TextField label="Texto destacado" value={block.text} onChange={v => set('text', v)} multiline />
      </>

    case 'quote':
      return <>
        <TextField label="Cita" value={block.text} onChange={v => set('text', v)} multiline />
        <TextField label="Autor (opcional)" value={block.author} onChange={v => set('author', v)} />
      </>

    case 'fact':
      return <>
        <TextField label="Etiqueta (ej: ¿Sabías que?)" value={block.label} onChange={v => set('label', v)} />
        <TextField label="Texto" value={block.text} onChange={v => set('text', v)} multiline />
      </>

    case 'hero':
      return <>
        <TextField label="URL imagen" value={block.src} onChange={v => set('src', v)} mono />
        <TextField label="Alt text" value={block.alt} onChange={v => set('alt', v)} />
        <TextField label="Pie de foto" value={block.caption} onChange={v => set('caption', v)} />
        <TextField label="Crédito" value={block.credit} onChange={v => set('credit', v)} />
        {block.src && <img src={block.src} alt="" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '6px', marginTop: '0.5rem', opacity: 0.8 }} />}
      </>

    case 'image':
      return <>
        <TextField label="URL imagen" value={block.src} onChange={v => set('src', v)} mono />
        <TextField label="Alt text" value={block.alt} onChange={v => set('alt', v)} />
        <TextField label="Pie de foto" value={block.caption} onChange={v => set('caption', v)} />
        <TextField label="Crédito" value={block.credit} onChange={v => set('credit', v)} />
        <div style={{ marginBottom: '0.6rem' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Tamaño</p>
          <select value={block.size || 'medium'} onChange={e => set('size', e.target.value)} style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}>
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="full">Ancho completo</option>
          </select>
        </div>
        {block.src && <img src={block.src} alt="" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '6px', marginTop: '0.5rem', opacity: 0.8 }} />}
      </>

    case 'video':
      return <>
        <TextField label="URL vídeo (YouTube o archivo)" value={block.src} onChange={v => set('src', v)} mono />
        <TextField label="Título" value={block.title} onChange={v => set('title', v)} />
        <TextField label="Descripción" value={block.description} onChange={v => set('description', v)} multiline />
      </>

    case 'author':
      return <>
        <TextField label="Nombre" value={block.name} onChange={v => set('name', v)} />
        <TextField label="Años (ej: 1895 – 1965)" value={block.years} onChange={v => set('years', v)} />
        <TextField label="URL imagen" value={block.src} onChange={v => set('src', v)} mono />
        <TextField label="Texto principal" value={block.text} onChange={v => set('text', v)} multiline />
        <TextField label="Texto expandible" value={block.text2} onChange={v => set('text2', v)} multiline />
        <TextField label="Cita" value={block.quote} onChange={v => set('quote', v)} multiline />
        {block.src && <img src={block.src} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginTop: '0.5rem', opacity: 0.8 }} />}
      </>

    case 'case_study':
      return <>
        <TextField label="Título" value={block.title} onChange={v => set('title', v)} />
        <TextField label="URL imagen" value={block.src} onChange={v => set('src', v)} mono />
        <TextField label="Texto principal" value={block.text} onChange={v => set('text', v)} multiline />
        <TextField label="Texto expandible" value={block.text2} onChange={v => set('text2', v)} multiline />
        {block.src && <img src={block.src} alt="" style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '6px', marginTop: '0.5rem', opacity: 0.8 }} />}
      </>

    case 'divider':
      return <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Separador visual — sin configuración</p>

    default:
      return (
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Bloque tipo <code style={{ color: 'var(--accent)' }}>{block.type}</code> — edición avanzada en JSON:
          </p>
          <textarea
            value={JSON.stringify(block, null, 2)}
            onChange={e => { try { onChange(JSON.parse(e.target.value)) } catch {} }}
            style={{ width: '100%', minHeight: '160px', background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.75rem', padding: '0.6rem', outline: 'none', resize: 'vertical' }}
          />
        </div>
      )
  }
}

// ─── Tarjeta de bloque individual ────────────────────────────────────────────
function BlockCard({ block, index, total, onChange, onDelete, onMove }: {
  block: any; index: number; total: number;
  onChange: (b: any) => void; onDelete: () => void; onMove: (dir: -1 | 1) => void
}) {
  const [open, setOpen] = useState(false)
  const typeLabel = BLOCK_TYPES.find(t => t.type === block.type)?.label || block.type

  const preview = block.text?.substring(0, 80) || block.title?.substring(0, 80) || block.name || block.src?.split('/').pop() || ''

  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid ' + (open ? 'var(--accent)' : 'var(--border)'),
      borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.15s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', minWidth: '1.2rem' }}>{index + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>{typeLabel}</span>
          {preview && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onMove(-1)} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', opacity: index === 0 ? 0.3 : 1 }}><ChevronUp size={14} /></button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', opacity: index === total - 1 ? 0.3 : 1 }}><ChevronDown size={14} /></button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.2rem' }}><Trash2 size={14} /></button>
        </div>
        <span style={{ color: 'var(--text-muted)', display: 'flex', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <ChevronDown size={15} />
        </span>
      </div>

      {/* Contenido expandible */}
      {open && (
        <div style={{ borderTop: '0.5px solid var(--border)', padding: '1rem' }}>
          <BlockEditor block={block} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function LessonEditor({ lesson }: { lesson: any }) {
  const [blocks, setBlocks] = useState<any[]>(lesson.content || [])
  const [title, setTitle] = useState(lesson.title || '')
  const [subtitle, setSubtitle] = useState(lesson.subtitle || '')
  const [minutes, setMinutes] = useState(lesson.estimated_minutes || 15)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addingType, setAddingType] = useState(false)
  const supabase = createClient()

  const save = async () => {
    setSaving(true)
    await supabase.from('lessons').update({
      title,
      subtitle,
      estimated_minutes: minutes,
      content: blocks,
    }).eq('id', lesson.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const updateBlock = (i: number, block: any) => {
    const next = [...blocks]; next[i] = block; setBlocks(next)
  }
  const deleteBlock = (i: number) => {
    setBlocks(blocks.filter((_, idx) => idx !== i))
  }
  const moveBlock = (i: number, dir: -1 | 1) => {
    const next = [...blocks]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setBlocks(next)
  }
  const addBlock = (type: string) => {
    setBlocks([...blocks, { ...DEFAULT_BLOCK[type] }])
    setAddingType(false)
  }

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/lecciones" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem' }}>
          <ChevronLeft size={14} /> Lecciones
        </Link>
        <div style={{ flex: 1 }} />
        <Link href={`/student/leccion/${lesson.slug}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem', border: '0.5px solid var(--border)', borderRadius: '6px', padding: '0.45rem 0.9rem' }}>
          <Eye size={13} /> Vista previa
        </Link>
        <button onClick={save} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
          <Save size={13} />
          {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Metadatos */}
      <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p className="accent-label" style={{ marginBottom: '1rem' }}>Metadatos</p>
        <TextField label="Título" value={title} onChange={setTitle} />
        <TextField label="Subtítulo" value={subtitle} onChange={setSubtitle} />
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Minutos estimados</p>
          <input type="number" value={minutes} onChange={e => setMinutes(Number(e.target.value))} style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100px' }} />
        </div>
      </div>

      {/* Lista de bloques */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {blocks.map((block, i) => (
          <BlockCard
            key={i}
            block={block}
            index={i}
            total={blocks.length}
            onChange={b => updateBlock(i, b)}
            onDelete={() => deleteBlock(i)}
            onMove={dir => moveBlock(i, dir)}
          />
        ))}
      </div>

      {/* Añadir bloque */}
      {!addingType ? (
        <button onClick={() => setAddingType(true)} style={{
          width: '100%', padding: '0.75rem', border: '0.5px dashed var(--border)',
          borderRadius: '8px', background: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          transition: 'border-color 0.2s, color 0.2s',
        }}>
          <Plus size={15} /> Añadir bloque
        </button>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--accent)', borderRadius: '10px', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>¿Qué tipo de bloque quieres añadir?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} onClick={() => addBlock(bt.type)} style={{
                padding: '0.5rem 0.75rem', border: '0.5px solid var(--border)', borderRadius: '6px',
                background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer',
                fontSize: '0.78rem', textAlign: 'left', transition: 'border-color 0.15s',
              }}>
                {bt.label}
              </button>
            ))}
          </div>
          <button onClick={() => setAddingType(false)} className="btn-ghost" style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem' }}>Cancelar</button>
        </div>
      )}

      <div style={{ height: '4rem' }} />
    </main>
  )
}