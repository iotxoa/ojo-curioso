'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Clock, User, BookOpen } from 'lucide-react'

export default function AdminClient({ submissions, students }: { submissions: any[], students: any[] }) {
  const [tab, setTab] = useState<'submissions' | 'students'>('submissions')
  const [selected, setSelected] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [grade, setGrade] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const pending = submissions.filter(s => s.status === 'submitted')
  const reviewed = submissions.filter(s => s.status === 'reviewed')

  async function handleReview(submissionId: number) {
    setSaving(true)
    await supabase.from('submissions').update({
      admin_feedback: feedback,
      admin_grade: grade,
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
    }).eq('id', submissionId)
    setSaving(false)
    setSelected(null)
    setFeedback('')
    setGrade('')
  }

  const tabStyle = (active: boolean) => ({
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    border: '0.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    letterSpacing: '0.05em',
  })

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
        <p className="accent-label" style={{ marginBottom: '0.5rem' }}>panel de profesor</p>
        <h1 style={{ marginBottom: '0.25rem' }}>El ojo curioso</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {pending.length} entrega{pending.length !== 1 ? 's' : ''} pendiente{pending.length !== 1 ? 's' : ''} de revisión
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <button style={tabStyle(tab === 'submissions')} onClick={() => setTab('submissions')}>
          Entregas {pending.length > 0 && `(${pending.length})`}
        </button>
        <button style={tabStyle(tab === 'students')} onClick={() => setTab('students')}>
          Alumnos ({students.length})
        </button>
      </div>

      {/* ENTREGAS */}
      {tab === 'submissions' && (
        <div>
          {pending.length === 0 && reviewed.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
              Aún no hay entregas.
            </p>
          )}

          {pending.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p className="accent-label" style={{ marginBottom: '1rem' }}>pendientes de revisión</p>
              {pending.map(sub => (
                <div key={sub.id} className="card" style={{ padding: '1.25rem', marginBottom: '0.875rem', cursor: 'pointer' }}
                  onClick={() => { setSelected(sub); setFeedback(''); setGrade('') }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {sub.exercise?.title || 'Ejercicio'}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {sub.exercise?.lesson?.title} · Entregado {new Date(sub.submitted_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span className="badge badge-pending">pendiente</span>
                  </div>
                  {sub.text_content && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {sub.text_content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {reviewed.length > 0 && (
            <div>
              <p className="accent-label" style={{ marginBottom: '1rem' }}>revisadas</p>
              {reviewed.map(sub => (
                <div key={sub.id} className="card" style={{ padding: '1.25rem', marginBottom: '0.875rem', opacity: 0.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{sub.exercise?.title}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.exercise?.lesson?.title}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {sub.admin_grade && <span className="badge badge-done">{sub.admin_grade}</span>}
                      <span className="badge badge-done">revisada</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ALUMNOS */}
      {tab === 'students' && (
        <div>
          {students.map(student => {
            const completed = student.progress.filter((p: any) => p.status === 'completed').length
            return (
              <div key={student.id} className="card" style={{ padding: '1.25rem', marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <User size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{student.full_name || student.email}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.email}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>{completed} lecciones</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>completadas</p>
                  </div>
                </div>
                {student.progress.length > 0 && (
                  <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '0.5px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {student.progress.map((p: any) => (
                        <span key={p.id} className={`badge ${p.status === 'completed' ? 'badge-done' : 'badge-active'}`}>
                          {p.lesson?.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de corrección */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', zIndex: 200,
        }} onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', background: 'var(--bg-card)' }}>
            <p className="accent-label" style={{ marginBottom: '0.5rem' }}>corregir ejercicio</p>
            <h3 style={{ marginBottom: '0.25rem' }}>{selected.exercise?.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {selected.exercise?.lesson?.title}
            </p>

            <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <p className="accent-label" style={{ marginBottom: '0.5rem' }}>respuesta del alumno</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {selected.text_content}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Tu feedback
              </label>
              <textarea className="input" value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Escribe tu comentario para el alumno..." style={{ minHeight: '120px' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Calificación
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Excelente', 'Muy bien', 'Bien', 'A mejorar'].map(g => (
                  <button key={g}
                    style={{
                      padding: '0.4rem 0.875rem', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '0.8rem',
                      background: grade === g ? 'var(--accent-dim)' : 'var(--bg-surface)',
                      border: `0.5px solid ${grade === g ? 'var(--accent)' : 'var(--border)'}`,
                      color: grade === g ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                    onClick={() => setGrade(g)}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" onClick={() => handleReview(selected.id)} disabled={saving || !feedback.trim()}>
                {saving ? 'Guardando...' : 'Enviar feedback'}
              </button>
              <button className="btn-ghost" onClick={() => setSelected(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
