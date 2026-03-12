'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CheckCircle, Clock } from 'lucide-react'
import type { Lesson, QuizQuestion, Exercise, LessonProgress, QuizResult, Submission, ContentBlock } from '@/types'
import Link from 'next/link'

interface Props {
  lesson: Lesson
  questions: QuizQuestion[]
  exercises: Exercise[]
  progress: LessonProgress | null
  quizResult: QuizResult | null
  submissions: Submission[]
  userId: string
}

function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="lesson-body">
      {blocks.map((block, i) => {
        if (block.type === 'intro') return (
          <p key={i} className="lesson-intro">{block.text}</p>
        )
        if (block.type === 'section_title') return (
          <h2 key={i} className="lesson-section-title">{block.text}</h2>
        )
        if (block.type === 'paragraph') return (
          <p key={i} className="lesson-paragraph">{block.text}</p>
        )
        if (block.type === 'highlight') return (
          <div key={i} className="lesson-highlight">
            <p className="author">{block.author} · {block.year}</p>
            <p className="highlight-text">{block.text}</p>
          </div>
        )
        if (block.type === 'quote') return (
          <blockquote key={i} style={{
            borderLeft: '2px solid var(--accent)',
            paddingLeft: '1.5rem',
            margin: '2rem 0',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
          }}>
            <p>{block.text}</p>
            {block.author && <cite style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'normal' }}>— {block.author}</cite>}
          </blockquote>
        )
        return null
      })}
    </div>
  )
}

function QuizSection({ questions, lessonId, existingResult, userId, onComplete }: {
  questions: QuizQuestion[]
  lessonId: number
  existingResult: QuizResult | null
  userId: string
  onComplete: () => void
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    existingResult ? existingResult.answers as number[] : new Array(questions.length).fill(null)
  )
  const [submitted, setSubmitted] = useState(!!existingResult)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit() {
    if (answers.some(a => a === null)) return
    setLoading(true)
    const correct = answers.filter((a, i) => a === questions[i].correct_index).length
    const score = Math.round((correct / questions.length) * 100)

    await supabase.from('quiz_results').upsert({
      user_id: userId, lesson_id: lessonId,
      score, answers, completed_at: new Date().toISOString(),
    })
    setSubmitted(true)
    setLoading(false)
    if (score >= 60) onComplete()
  }

  const score = submitted
    ? Math.round((answers.filter((a, i) => a === questions[i].correct_index).length / questions.length) * 100)
    : null

  return (
    <div style={{ marginTop: '3rem' }}>
      <div className="divider" style={{ marginBottom: '2.5rem' }} />
      <p className="accent-label" style={{ marginBottom: '0.5rem' }}>test de la lección</p>
      <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>¿Qué has aprendido?</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Necesitas un 60% para completar la lección y desbloquear la siguiente.
      </p>

      {submitted && score !== null && (
        <div className="card" style={{
          padding: '1.25rem', marginBottom: '2rem',
          borderColor: score >= 60 ? 'var(--success)' : 'var(--danger)',
          background: score >= 60 ? 'rgba(74,138,90,0.08)' : 'rgba(138,58,58,0.08)',
        }}>
          <p style={{ fontSize: '1.1rem', color: score >= 60 ? '#6abf6a' : '#bf6a6a', fontWeight: 700 }}>
            {score}% · {score >= 60 ? '¡Lección completada!' : 'Inténtalo de nuevo'}
          </p>
          {score < 60 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Repasa la lección y vuelve a intentarlo cuando quieras.
            </p>
          )}
        </div>
      )}

      {questions.map((q, qi) => {
        const chosen = answers[qi]
        const isCorrect = submitted && chosen === q.correct_index

        return (
          <div key={q.id} style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 400 }}>
              <span style={{ color: 'var(--accent)', marginRight: '0.5rem', fontFamily: 'var(--font-serif)' }}>{qi + 1}.</span>
              {q.question}
            </p>
            {q.options.map((opt, oi) => {
              let cls = 'quiz-option'
              if (submitted) {
                if (oi === q.correct_index) cls += ' correct'
                else if (oi === chosen && chosen !== q.correct_index) cls += ' wrong'
              } else if (chosen === oi) {
                cls += ' selected'
              }
              return (
                <button key={oi} className={cls} disabled={submitted}
                  onClick={() => {
                    if (submitted) return
                    const next = [...answers]
                    next[qi] = oi
                    setAnswers(next)
                  }}>
                  {opt}
                </button>
              )
            })}
            {submitted && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
                {q.explanation}
              </p>
            )}
          </div>
        )
      })}

      {!submitted && (
        <button className="btn-primary" onClick={handleSubmit}
          disabled={loading || answers.some(a => a === null)}>
          {loading ? 'Corrigiendo...' : 'Entregar test'}
        </button>
      )}

      {submitted && score !== null && score < 60 && (
        <button className="btn-ghost" onClick={() => {
          setAnswers(new Array(questions.length).fill(null))
          setSubmitted(false)
        }}>
          Intentar de nuevo
        </button>
      )}
    </div>
  )
}

function ExerciseSection({ exercises, submissions, userId }: {
  exercises: Exercise[]
  submissions: Submission[]
  userId: string
}) {
  const [texts, setTexts] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [sent, setSent] = useState<Record<number, boolean>>({})
  const supabase = createClient()

  async function handleSubmit(exerciseId: number) {
    const text = texts[exerciseId]
    if (!text?.trim()) return
    setLoading(prev => ({ ...prev, [exerciseId]: true }))
    await supabase.from('submissions').insert({
      user_id: userId,
      exercise_id: exerciseId,
      text_content: text,
      status: 'submitted',
    })
    setSent(prev => ({ ...prev, [exerciseId]: true }))
    setLoading(prev => ({ ...prev, [exerciseId]: false }))
  }

  return (
    <div style={{ marginTop: '3rem' }}>
      <div className="divider" style={{ marginBottom: '2.5rem' }} />
      <p className="accent-label" style={{ marginBottom: '0.5rem' }}>ejercicio</p>

      {exercises.map(ex => {
        const existing = submissions.find(s => s.exercise_id === ex.id)
        const isSent = sent[ex.id] || !!existing

        return (
          <div key={ex.id}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>{ex.title}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              {ex.description}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
              {ex.due_note}
            </p>

            {isSent ? (
              <div className="card" style={{ padding: '1.25rem', borderColor: 'var(--success)', background: 'rgba(74,138,90,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} style={{ color: '#6abf6a' }} />
                  <p style={{ fontSize: '0.9rem', color: '#6abf6a' }}>
                    {existing?.status === 'reviewed' ? 'Ejercicio revisado' : 'Ejercicio entregado — te llega el feedback pronto'}
                  </p>
                </div>
                {existing?.admin_feedback && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid var(--border)' }}>
                    <p className="accent-label" style={{ marginBottom: '0.4rem' }}>Feedback</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{existing.admin_feedback}</p>
                    {existing.admin_grade && (
                      <span className="badge badge-active" style={{ marginTop: '0.5rem' }}>{existing.admin_grade}</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <textarea
                  className="input"
                  placeholder="Escribe aquí tu respuesta..."
                  value={texts[ex.id] || ''}
                  onChange={e => setTexts(prev => ({ ...prev, [ex.id]: e.target.value }))}
                />
                <button className="btn-primary" style={{ marginTop: '1rem' }}
                  onClick={() => handleSubmit(ex.id)}
                  disabled={loading[ex.id] || !texts[ex.id]?.trim()}>
                  {loading[ex.id] ? 'Enviando...' : 'Entregar ejercicio'}
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function LessonClient({ lesson, questions, exercises, progress, quizResult, submissions, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()

  async function markInProgress() {
    if (progress) return
    await supabase.from('lesson_progress').upsert({
      user_id: userId, lesson_id: lesson.id,
      status: 'in_progress', started_at: new Date().toISOString(),
    })
  }

  async function markCompleted() {
    await supabase.from('lesson_progress').upsert({
      user_id: userId, lesson_id: lesson.id,
      status: 'completed', completed_at: new Date().toISOString(),
    })
    router.refresh()
  }

  // Marcar como en progreso al ver
  useState(() => { markInProgress() })

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Back */}
      <Link href="/student/dashboard" style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        textDecoration: 'none', color: 'var(--text-muted)',
        fontSize: '0.8rem', marginBottom: '2rem',
        transition: 'color 0.2s',
      }}>
        <ChevronLeft size={14} /> Volver al inicio
      </Link>

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '3rem' }}>
        <p className="accent-label" style={{ marginBottom: '0.5rem' }}>{lesson.subtitle}</p>
        <h1 style={{ marginBottom: '0.5rem' }}>{lesson.title}</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Clock size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
          Lectura de aproximadamente {lesson.estimated_minutes} minutos
        </p>
      </div>

      {/* Content */}
      <div className="fade-up" style={{ animationDelay: '0.05s' }}>
        <ContentRenderer blocks={lesson.content} />
      </div>

      {/* Quiz */}
      {questions.length > 0 && (
        <QuizSection
          questions={questions}
          lessonId={lesson.id}
          existingResult={quizResult}
          userId={userId}
          onComplete={markCompleted}
        />
      )}

      {/* Exercise */}
      {exercises.length > 0 && (
        <ExerciseSection
          exercises={exercises}
          submissions={submissions}
          userId={userId}
        />
      )}

      {/* Bottom padding */}
      <div style={{ height: '4rem' }} />
    </main>
  )
}
