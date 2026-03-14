'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'

// El modal de corrección ha sido reemplazado por la página /admin/submissions/[id]
// que incluye editor rico, subida de fotos anotadas y notificación por email.

export default function AdminClient({ submissions, students }: { submissions: any[], students: any[] }) {
  const [tab, setTab] = useState<'submissions' | 'students'>('submissions')
  const router = useRouter()

  const pending = submissions.filter(s => s.status === 'submitted')
  const reviewed = submissions.filter(s => s.status === 'reviewed')

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

          {/* Pendientes — clic va a la página de corrección completa */}
          {pending.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p className="accent-label" style={{ marginBottom: '1rem' }}>pendientes de revisión</p>
              {pending.map(sub => (
                <div
                  key={sub.id}
                  className="card"
                  style={{ padding: '1.25rem', marginBottom: '0.875rem', cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {sub.exercise?.title || 'Ejercicio'}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {sub.exercise?.lesson?.title} · Entregado {new Date(sub.submitted_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span className="badge badge-pending">pendiente</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Corregir →</span>
                    </div>
                  </div>
                  {sub.text_content && (
                    <p style={{
                      marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {sub.text_content}
                    </p>
                  )}
                  {/* Indicador de archivos adjuntos */}
                  {sub.file_urls?.length > 0 && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      📎 {sub.file_urls.length} archivo{sub.file_urls.length !== 1 ? 's' : ''} adjunto{sub.file_urls.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Revisadas — también enlazables para ver/editar */}
          {reviewed.length > 0 && (
            <div>
              <p className="accent-label" style={{ marginBottom: '1rem' }}>revisadas</p>
              {reviewed.map(sub => (
                <div
                  key={sub.id}
                  className="card"
                  style={{ padding: '1.25rem', marginBottom: '0.875rem', opacity: 0.7, cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        {sub.exercise?.title}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {sub.exercise?.lesson?.title}
                      </p>
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

      {/* ALUMNOS — sin cambios */}
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
    </main>
  )
}