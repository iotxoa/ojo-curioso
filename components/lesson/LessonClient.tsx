'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronDown, ChevronUp, Clock, BookOpen, Play } from 'lucide-react'
import type { Lesson, QuizQuestion, Exercise, LessonProgress, QuizResult, Submission, ContentBlock } from '@/types'
import Link from 'next/link'
import { ExerciseBlock } from '@/components/lesson/ExerciseBlock'

interface Props {
  lesson: Lesson
  questions: QuizQuestion[]
  exercises: Exercise[]
  progress: LessonProgress | null
  quizResult: QuizResult | null
  submissions: Submission[]
  userId: string
}

type ExtBlock = ContentBlock
  | { type: 'video'; src: string; title?: string; description?: string }
  | { type: 'timeline'; title?: string; items: { year: string; text: string; image?: string }[] }
  | { type: 'fact'; text: string; label?: string }
  | { type: 'divider' }

function buildToc(blocks: ExtBlock[]) {
  return blocks.flatMap((b, i) => {
    if (b.type === 'section_title') return [{ id: `s-${i}`, label: (b as any).text }]
    if (b.type === 'author')       return [{ id: `a-${i}`, label: `Autor: ${(b as any).name}` }]
    if (b.type === 'case_study')   return [{ id: `c-${i}`, label: 'Estudio de caso' }]
    if (b.type === 'video')        return [{ id: `v-${i}`, label: (b as any).title || 'Vídeo' }]
    if (b.type === 'timeline')     return [{ id: `t-${i}`, label: (b as any).title || 'Cronología' }]
    return []
  })
}

function blockId(b: ExtBlock, i: number) {
  if (b.type === 'section_title') return `s-${i}`
  if (b.type === 'author')        return `a-${i}`
  if (b.type === 'case_study')    return `c-${i}`
  if (b.type === 'video')         return `v-${i}`
  if (b.type === 'timeline')      return `t-${i}`
  return undefined
}

function LessonToc({ items }: { items: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  useEffect(() => {
    const onScroll = () => {
      for (let i = items.length - 1; i >= 0; i--) {
        const el = document.getElementById(items[i].id)
        if (el && el.getBoundingClientRect().top < 160) { setActive(items[i].id); return }
      }
      setActive('')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])
  if (items.length < 2) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-strong)', borderRadius: '10px', marginBottom: '2.5rem', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
          <BookOpen size={13} /> En esta lección
        </span>
        <span style={{ color: 'var(--text-muted)', display: 'flex', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <ChevronDown size={15} />
        </span>
      </button>
      {open && (
        <div style={{ borderTop: '0.5px solid var(--border)', padding: '0.75rem 0' }}>
          {items.map((item, i) => (
            <a key={item.id} href={`#${item.id}`} onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1.25rem',
              fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.15s',
              color: active === item.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderLeft: active === item.id ? '2px solid var(--accent)' : '2px solid transparent',
            }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', minWidth: '1rem' }}>{i + 1}</span>
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function VideoBlock({ src, title, description }: { src: string; title?: string; description?: string }) {
  const [playing, setPlaying] = useState(false)
  const getEmbed = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : url
  }
  const getThumb = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : null
  }
  const thumb = getThumb(src)
  return (
    <div style={{ margin: '2.5rem 0' }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="accent-label">vídeo</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>·</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{title}</span>
        </div>
      )}
      <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#000', aspectRatio: '16/9', cursor: playing ? 'default' : 'pointer' }}
           onClick={() => !playing && setPlaying(true)}>
        {!playing ? (
          <>
            {thumb && <img src={thumb} alt={title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                <Play size={24} fill="var(--bg-base)" color="var(--bg-base)" style={{ marginLeft: '3px' }} />
              </div>
            </div>
            {title && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))' }}>
                <p style={{ color: '#fff', fontSize: '0.875rem', margin: 0 }}>{title}</p>
              </div>
            )}
          </>
        ) : (
          <iframe src={getEmbed(src)} title={title || 'Vídeo'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
        )}
      </div>
      {description && <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic', lineHeight: 1.6 }}>{description}</p>}
    </div>
  )
}

function TimelineBlock({ title, items }: { title?: string; items: { year: string; text: string; image?: string }[] }) {
  return (
    <div style={{ margin: '2.5rem 0' }}>
      {title && <p className="accent-label" style={{ marginBottom: '1.5rem' }}>{title}</p>}
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        <div style={{ position: 'absolute', left: '6px', top: '8px', bottom: '8px', width: '1px', background: 'linear-gradient(to bottom, var(--accent), transparent)' }} />
        {items.map((item, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: i < items.length - 1 ? '2rem' : 0 }}>
            <div style={{ position: 'absolute', left: '-2rem', top: '4px', width: '13px', height: '13px', borderRadius: '50%', border: '2px solid var(--accent)', background: i === 0 ? 'var(--accent)' : 'var(--bg-base)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.85rem', color: 'var(--accent)', display: 'block', marginBottom: '0.3rem' }}>{item.year}</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{item.text}</p>
            {item.image && <img src={item.image} alt={item.year} style={{ width: '100%', maxWidth: '320px', borderRadius: '6px', marginTop: '0.75rem', opacity: 0.85 }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function AuthorBlock({ b }: { b: any }) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = !!(b.text2 || b.links)
  return (
    <div style={{ margin: '2.5rem 0', background: 'var(--bg-card)', border: '0.5px solid var(--border-strong)', borderRadius: '12px', overflow: 'hidden' }}>
      {b.src && (
        <div style={{ position: 'relative' }}>
          <img src={b.src} alt={b.name || ''} style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', objectPosition: b.position || 'center top', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-card) 0%, transparent 50%)' }} />
        </div>
      )}
      <div style={{ padding: '1.5rem' }}>
        <p className="accent-label" style={{ marginBottom: '0.25rem' }}>autor destacado</p>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>{b.name}</h3>
        {b.years && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{b.years}</p>}
        {b.text && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{b.text}</p>}
        {hasMore && expanded && (
          <div style={{ marginTop: '1rem', animation: 'fadeUp 0.3s ease both' }}>
            {b.text2 && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1rem' }}>{b.text2}</p>}
            {b.quote && (
              <blockquote style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '1rem', marginTop: '0.75rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                "{b.quote}"
              </blockquote>
            )}
            {b.links && b.links.length > 0 && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {b.links.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent)', border: '0.5px solid var(--accent)', borderRadius: '4px', padding: '0.3rem 0.7rem', textDecoration: 'none' }}>
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Quote siempre visible cuando no hay contenido expandible */}
        {b.quote && !hasMore && (
          <blockquote style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '1rem', marginTop: '1rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            "{b.quote}"
          </blockquote>
        )}
        {hasMore && (
          <button onClick={() => setExpanded(e => !e)} style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', padding: 0 }}>
            {expanded ? <><ChevronUp size={13} /> Menos</> : <><ChevronDown size={13} /> Saber más</>}
          </button>
        )}
      </div>
    </div>
  )
}

function CaseStudyBlock({ b }: { b: any }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ margin: '2.5rem 0', background: 'var(--accent-dim)', border: '0.5px solid var(--accent)', borderRadius: '12px', overflow: 'hidden' }}>
      {b.src && (
        <div style={{ position: 'relative' }}>
          <img src={b.src} alt={b.alt || ''} style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--accent-dim) 0%, transparent 55%)' }} />
          {b.title && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem 1.5rem' }}>
              <p className="accent-label" style={{ marginBottom: '0.35rem' }}>estudio de caso</p>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{b.title}</h3>
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '1.5rem' }}>
        {!b.src && (
          <>
            <p className="accent-label" style={{ marginBottom: '0.5rem' }}>estudio de caso</p>
            {b.title && <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{b.title}</h3>}
          </>
        )}
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{b.text}</p>
        {b.text2 && (
          <>
            {expanded && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginTop: '1rem', animation: 'fadeUp 0.3s ease both' }}>{b.text2}</p>}
            <button onClick={() => setExpanded(e => !e)} style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', padding: 0 }}>
              {expanded ? <><ChevronUp size={13} /> Menos</> : <><ChevronDown size={13} /> Continuar leyendo</>}
            </button>
          </>
        )}
        {b.caption && !b.text2 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>{b.caption}</p>}
      </div>
    </div>
  )
}

function ContentRenderer({ blocks }: { blocks: ExtBlock[] }) {
  return (
    <div className="lesson-body">
      {blocks.map((block, i) => {
        const id = blockId(block, i)
        const anchor = id ? { id, style: { scrollMarginTop: '80px' } } : {}

        if (block.type === 'intro') return <p key={i} className="lesson-intro">{(block as any).text}</p>
        if (block.type === 'section_title') return <h2 key={i} {...anchor} className="lesson-section-title">{(block as any).text}</h2>
        if (block.type === 'paragraph') return <p key={i} className="lesson-paragraph">{(block as any).text}</p>
        if (block.type === 'quote') return (
          <blockquote key={i} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '1.5rem', margin: '2rem 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
            <p>{(block as any).text}</p>
            {(block as any).author && <cite style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'normal' }}>— {(block as any).author}</cite>}
          </blockquote>
        )
        if (block.type === 'highlight') return (
          <div key={i} className="lesson-highlight">
            <p className="author">{(block as any).author}{(block as any).year ? ` · ${(block as any).year}` : ''}</p>
            <p className="highlight-text">{(block as any).text}</p>
          </div>
        )
        if (block.type === 'hero') return (
          <div key={i} style={{ margin: '2.5rem -1.5rem', position: 'relative' }}>
            <img src={(block as any).src} alt={(block as any).alt || ''} style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }} />
            {((block as any).caption || (block as any).credit) && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right', padding: '0.4rem 1.5rem 0', fontStyle: 'italic' }}>
                {(block as any).caption}{(block as any).caption && (block as any).credit ? ' · ' : ''}{(block as any).credit}
              </p>
            )}
          </div>
        )
        if (block.type === 'image') {
          const sizes: Record<string, string> = { small: '320px', medium: '560px', full: '100%' }
          const maxW = sizes[(block as any).size || 'medium'] || '560px'
          return (
            <figure key={i} style={{ margin: '2rem auto', maxWidth: maxW }}>
              <img src={(block as any).src} alt={(block as any).alt || ''} style={{ width: '100%', borderRadius: '6px', display: 'block' }} />
              {((block as any).caption || (block as any).credit) && (
                <figcaption style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic', textAlign: 'center' }}>
                  {(block as any).caption}{(block as any).caption && (block as any).credit ? ' · ' : ''}{(block as any).credit}
                </figcaption>
              )}
            </figure>
          )
        }
        if (block.type === 'gallery') return (
          <div key={i} style={{ margin: '2rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((block as any).images?.length || 2, 3)}, 1fr)`, gap: '0.5rem' }}>
              {((block as any).images || []).map((img: any, ii: number) => (
                <figure key={ii} style={{ margin: 0 }}>
                  <img src={img.src} alt={img.alt || ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
                  {img.caption && <figcaption style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontStyle: 'italic', textAlign: 'center' }}>{img.caption}</figcaption>}
                </figure>
              ))}
            </div>
            {(block as any).caption && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center', fontStyle: 'italic' }}>{(block as any).caption}</p>}
          </div>
        )
        if (block.type === 'author') return <div key={i} {...anchor}><AuthorBlock b={block} /></div>
        if (block.type === 'case_study') return <div key={i} {...anchor}><CaseStudyBlock b={block} /></div>
        if (block.type === 'video') return <div key={i} {...anchor}><VideoBlock src={(block as any).src} title={(block as any).title} description={(block as any).description} /></div>
        if (block.type === 'timeline') return <div key={i} {...anchor}><TimelineBlock title={(block as any).title} items={(block as any).items} /></div>
        if (block.type === 'fact') return (
          <div key={i} style={{ margin: '2rem 0', padding: '1.5rem', background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: '10px', textAlign: 'center' }}>
            {(block as any).label && <p className="accent-label" style={{ marginBottom: '0.5rem' }}>{(block as any).label}</p>}
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic', margin: 0 }}>{(block as any).text}</p>
          </div>
        )
        if (block.type === 'divider') return <div key={i} className="divider" style={{ margin: '2.5rem 0' }} />
        return null
      })}
    </div>
  )
}

function QuizSection({ questions, lessonId, existingResult, userId, onComplete }: {
  questions: QuizQuestion[]; lessonId: number; existingResult: QuizResult | null; userId: string; onComplete: () => void
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(existingResult ? existingResult.answers as number[] : new Array(questions.length).fill(null))
  const [submitted, setSubmitted] = useState(!!existingResult)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit() {
    if (answers.some(a => a === null)) return
    setLoading(true)
    const correct = answers.filter((a, i) => a === questions[i].correct_index).length
    const score = Math.round((correct / questions.length) * 100)
    await supabase.from('quiz_results').upsert({ user_id: userId, lesson_id: lessonId, score, answers, completed_at: new Date().toISOString() })
    setSubmitted(true); setLoading(false)
    if (score >= 60) onComplete()
  }

  const score = submitted ? Math.round((answers.filter((a, i) => a === questions[i].correct_index).length / questions.length) * 100) : null

  return (
    <div style={{ marginTop: '3rem' }}>
      <div className="divider" style={{ marginBottom: '2.5rem' }} />
      <p className="accent-label" style={{ marginBottom: '0.5rem' }}>test de la lección</p>
      <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>¿Qué has aprendido?</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Necesitas un 60% para completar la lección y desbloquear la siguiente.</p>
      {submitted && score !== null && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', borderColor: score >= 60 ? 'var(--success)' : 'var(--danger)', background: score >= 60 ? 'rgba(74,138,90,0.08)' : 'rgba(138,58,58,0.08)' }}>
          <p style={{ fontSize: '1.1rem', color: score >= 60 ? '#6abf6a' : '#bf6a6a', fontWeight: 700 }}>{score}% · {score >= 60 ? '¡Lección completada!' : 'Inténtalo de nuevo'}</p>
          {score < 60 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Repasa la lección y vuelve a intentarlo cuando quieras.</p>}
        </div>
      )}
      {questions.map((q, qi) => {
        const chosen = answers[qi]
        return (
          <div key={q.id} style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 400 }}>
              <span style={{ color: 'var(--accent)', marginRight: '0.5rem', fontFamily: 'var(--font-serif)' }}>{qi + 1}.</span>{q.question}
            </p>
            {q.options.map((opt, oi) => {
              let cls = 'quiz-option'
              if (submitted) { if (oi === q.correct_index) cls += ' correct'; else if (oi === chosen && chosen !== q.correct_index) cls += ' wrong' }
              else if (chosen === oi) cls += ' selected'
              return <button key={oi} className={cls} disabled={submitted} onClick={() => { if (submitted) return; const next = [...answers]; next[qi] = oi; setAnswers(next) }}>{opt}</button>
            })}
            {submitted && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', paddingLeft: '0.5rem' }}>{q.explanation}</p>}
          </div>
        )
      })}
      {!submitted && <button className="btn-primary" onClick={handleSubmit} disabled={loading || answers.some(a => a === null)}>{loading ? 'Corrigiendo...' : 'Entregar test'}</button>}
      {submitted && score !== null && score < 60 && <button className="btn-ghost" onClick={() => { setAnswers(new Array(questions.length).fill(null)); setSubmitted(false) }}>Intentar de nuevo</button>}
    </div>
  )
}

export default function LessonClient({ lesson, questions, exercises, progress, quizResult, submissions, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const blocks = (lesson.content || []) as ExtBlock[]
  const tocItems = buildToc(blocks)

  async function markInProgress() {
    if (progress) return
    await supabase.from('lesson_progress').upsert({ user_id: userId, lesson_id: lesson.id, status: 'in_progress', started_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
  }
  async function markCompleted() {
    await supabase.from('lesson_progress').upsert({ user_id: userId, lesson_id: lesson.id, status: 'completed', completed_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
    router.refresh()
  }
  useState(() => { markInProgress() })

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <Link href="/student/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '2rem', transition: 'color 0.2s' }}>
        <ChevronLeft size={14} /> Volver al inicio
      </Link>

      <div className="fade-up" style={{ marginBottom: '3rem' }}>
        <p className="accent-label" style={{ marginBottom: '0.5rem' }}>{lesson.subtitle}</p>
        <h1 style={{ marginBottom: '0.75rem' }}>{lesson.title}</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Clock size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
          Lectura de aproximadamente {lesson.estimated_minutes} minutos
        </p>
      </div>

      {tocItems.length >= 2 && (
        <div className="fade-up" style={{ animationDelay: '0.03s' }}>
          <LessonToc items={tocItems} />
        </div>
      )}

      <div className="fade-up" style={{ animationDelay: '0.05s' }}>
        <ContentRenderer blocks={blocks} />
      </div>

      {questions.length > 0 && (
        <QuizSection questions={questions} lessonId={lesson.id} existingResult={quizResult} userId={userId} onComplete={markCompleted} />
      )}

      {exercises.length > 0 && exercises.map(exercise => (
        <ExerciseBlock key={exercise.id} exercise={exercise} lessonTitle={lesson.title} lessonSlug={lesson.slug} userId={userId} />
      ))}

      <div style={{ height: '4rem' }} />
    </main>
  )
}