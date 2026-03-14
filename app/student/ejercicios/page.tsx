// app/student/ejercicios/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import Link from 'next/link'
import type { Exercise, Submission, LessonProgress } from '@/types'

export default async function EjerciciosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Obtener progreso del alumno — solo lecciones desbloqueadas
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status')
    .eq('user_id', user.id)

  const unlockedLessonIds = new Set(
    (progress || []).map((p: LessonProgress) => p.lesson_id)
  )

  // Obtener ejercicios solo de lecciones desbloqueadas
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('*, lesson:lessons(id, title, slug, order_index, module:modules(title, order_index))')
    .order('id')

  // Obtener entregas del alumno
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)

  const submissionMap = new Map(
    (submissions || []).map((s: Submission) => [s.exercise_id, s])
  )

  // Separar ejercicios en desbloqueados y bloqueados
  const exercises = (allExercises || []).map((ex: any) => ({
    ...ex,
    unlocked: unlockedLessonIds.has(ex.lesson?.id),
    submission: submissionMap.get(ex.id) || null,
  }))

  const unlocked = exercises.filter((ex: any) => ex.unlocked)
  const locked = exercises.filter((ex: any) => !ex.unlocked)

  // Contar feedback pendiente de leer
  const pendingFeedback = (submissions || []).filter(
    (s: Submission) => s.status === 'reviewed' && s.admin_feedback
  ).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Nav role={profile?.role || 'student'} />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
          <p className="accent-label" style={{ marginBottom: '0.5rem' }}>tu trabajo</p>
          <h1 style={{ marginBottom: '0.25rem' }}>Ejercicios</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {unlocked.length} ejercicio{unlocked.length !== 1 ? 's' : ''} disponible{unlocked.length !== 1 ? 's' : ''}
            {locked.length > 0 && ` · ${locked.length} por desbloquear`}
          </p>
        </div>

        {/* Banner feedback pendiente */}
        {pendingFeedback > 0 && (
          <div className="fade-up" style={{
            background: 'rgba(196,151,90,0.12)',
            border: '1px solid rgba(196,151,90,0.4)',
            borderRadius: '10px',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <span style={{ fontSize: '1.4rem' }}>✦</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--accent)', fontWeight: 600 }}>
                Tienes {pendingFeedback} corrección{pendingFeedback !== 1 ? 'es' : ''} nueva{pendingFeedback !== 1 ? 's' : ''}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tu instructor ha revisado tu trabajo. Entra en la lección para verlo.
              </p>
            </div>
          </div>
        )}

        {/* Sin ejercicios desbloqueados */}
        {unlocked.length === 0 && (
          <div className="card fade-up" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>📷</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Aún no tienes ejercicios disponibles.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Completa la primera lección para desbloquear tu primer ejercicio.
            </p>
            <Link href="/student/dashboard" style={{
              color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none',
            }}>
              Ir al curso →
            </Link>
          </div>
        )}

        {/* Ejercicios desbloqueados */}
        {unlocked.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            {unlocked.map((ex: any) => {
              const sub = ex.submission
              const isReviewed = sub?.status === 'reviewed'
              const isSubmitted = sub?.status === 'submitted'

              return (
                <Link
                  key={ex.id}
                  href={`/student/leccion/${ex.lesson?.slug}`}
                  style={{ textDecoration: 'none', display: 'block', marginBottom: '0.75rem' }}
                >
                  <div className="card" style={{
                    padding: '1.25rem 1.5rem',
                    borderColor: isReviewed ? 'var(--accent)' : undefined,
                    background: isReviewed ? 'rgba(196,151,90,0.06)' : undefined,
                    display: 'flex', alignItems: 'center', gap: '1rem',
                  }}>
                    {/* Icono estado */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: isReviewed
                        ? 'rgba(196,151,90,0.2)'
                        : isSubmitted
                        ? 'rgba(100,120,80,0.15)'
                        : 'var(--bg-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}>
                      {isReviewed ? '✦' : isSubmitted ? '⟳' : '◈'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {ex.title}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {ex.lesson?.module?.title} · {ex.lesson?.title}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {isReviewed && (
                        <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                          Corregido
                        </span>
                      )}
                      {isSubmitted && (
                        <span className="badge" style={{
                          fontSize: '0.7rem',
                          background: 'rgba(100,120,80,0.15)',
                          color: '#6abf6a',
                          border: '0.5px solid rgba(100,120,80,0.3)',
                        }}>
                          Entregado
                        </span>
                      )}
                      {!sub && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pendiente</span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>→</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Ejercicios bloqueados */}
        {locked.length > 0 && (
          <div>
            <p className="accent-label" style={{ marginBottom: '1rem' }}>
              por desbloquear
            </p>
            {locked.map((ex: any) => (
              <div key={ex.id} className="card" style={{
                padding: '1.25rem 1.5rem',
                marginBottom: '0.5rem',
                opacity: 0.35,
                cursor: 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--bg-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem',
                }}>
                  🔒
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {ex.title}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {ex.lesson?.module?.title} · {ex.lesson?.title}
                  </p>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🔒</span>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}