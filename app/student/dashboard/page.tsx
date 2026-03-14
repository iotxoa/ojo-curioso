// app/student/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { FeedbackBanner } from '@/components/student/FeedbackBanner'
import type { Module, Lesson, LessonProgress } from '@/types'

export default async function Dashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: modules }, { data: progress }, { data: reviewedSubmissions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('modules').select('*, lessons(*)').eq('published', true).order('order_index'),
    supabase.from('lesson_progress').select('*').eq('user_id', user.id),
    supabase
      .from('submissions')
      .select('*, exercise:exercises(title, lesson:lessons(title, slug))')
      .eq('user_id', user.id)
      .eq('status', 'reviewed'),
  ])

  const progressMap = new Map((progress || []).map((p: LessonProgress) => [p.lesson_id, p]))
  const allLessons = (modules || []).flatMap((m: Module) => (m.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index))
  const completedCount = allLessons.filter((l: Lesson) => progressMap.get(l.id)?.status === 'completed').length
  const totalCount = allLessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Insignias
  const badges = []
  if (completedCount >= 1) badges.push({ emoji: '👁️', name: 'Ojo curioso', desc: 'Primera lección completada' })
  if (completedCount >= 3) badges.push({ emoji: '☀️', name: 'Cazador de luz', desc: '3 lecciones completadas' })
  if (completedCount >= 6) badges.push({ emoji: '🏙️', name: 'Alma callejera', desc: '6 lecciones completadas' })
  if (completedCount >= totalCount && totalCount > 0) badges.push({ emoji: '🎞️', name: 'El ojo curioso', desc: 'Curso completado' })

  // Items para el banner de feedback
  const feedbackItems = (reviewedSubmissions || []).map((s: any) => ({
    lessonSlug: s.exercise?.lesson?.slug || '',
    lessonTitle: s.exercise?.lesson?.title || '',
    exerciseTitle: s.exercise?.title || '',
  })).filter((item: any) => item.lessonSlug)

  function getLessonStatus(lessonId: number, globalIdx: number) {
    const p = progressMap.get(lessonId)
    if (p?.status === 'completed') return 'completed'
    if (globalIdx === 0) return 'available'
    const prev = allLessons[globalIdx - 1]
    if (progressMap.get(prev.id)?.status === 'completed') return 'available'
    return 'locked'
  }

  const modulesData = (modules || []).map((mod: Module) => {
    const modLessons = (mod.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)
    const modCompleted = modLessons.filter((l: Lesson) => progressMap.get(l.id)?.status === 'completed').length
    const lessons = modLessons.map((lesson: Lesson) => {
      const globalIdx = allLessons.findIndex((l: Lesson) => l.id === lesson.id)
      return { ...lesson, status: getLessonStatus(lesson.id, globalIdx) }
    })
    return { ...mod, lessons, modCompleted, modTotal: modLessons.length }
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Nav role={profile?.role || 'student'} />
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        <DashboardClient showOnboarding={!profile?.onboarding_completed} />

        {/* Banner de feedback — solo aparece si hay correcciones nuevas */}
        <FeedbackBanner
          count={feedbackItems.length}
          items={feedbackItems}
        />

        {/* Hero */}
        <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
          <p className="accent-label" style={{ marginBottom: '0.5rem' }}>bienvenido de nuevo</p>
          <h1 style={{ marginBottom: '0.5rem' }}>
            Hola, {profile?.full_name?.split(' ')[0] || 'fotógrafo'}
          </h1>
          <p style={{ maxWidth: '500px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Cada lección se desvela cuando terminas la anterior. Ve a tu ritmo.
          </p>
        </div>

        {/* Progreso global */}
        <div className="card fade-up" style={{ padding: '1.5rem', marginBottom: '1rem', animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <p className="accent-label">curso 1 — el ojo curioso</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{completedCount} de {totalCount} lecciones</p>
          </div>
          <div className="progress-track" style={{ marginBottom: '0.5rem' }}>
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {progressPct === 0 && 'Empieza cuando quieras — la primera lección te espera.'}
            {progressPct > 0 && progressPct < 50 && 'Buen comienzo. Cada lección cuenta.'}
            {progressPct >= 50 && progressPct < 100 && '¡Ya vas por la mitad! Sigue así.'}
            {progressPct === 100 && '🎉 ¡Curso completado! Eres un ojo curioso de verdad.'}
          </p>
        </div>

        {/* Insignias */}
        {badges.length > 0 && (
          <div className="card fade-up" style={{ padding: '1.25rem 1.5rem', marginBottom: '2.5rem', animationDelay: '0.08s' }}>
            <p className="accent-label" style={{ marginBottom: '1rem' }}>tus insignias</p>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {badges.map((b: any) => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{b.emoji}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{b.name}</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Módulos y lecciones */}
        {modulesData.map((mod: any, mi: number) => (
          <div key={mod.id} className="fade-up" style={{ marginBottom: '2.5rem', animationDelay: `${0.1 + mi * 0.05}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="divider" style={{ width: '2rem', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>
                    Módulo {mod.order_index}
                  </p>
                  <p style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', fontSize: '1.05rem', margin: 0 }}>
                    {mod.title}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                {mod.modCompleted}/{mod.modTotal}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {mod.lessons.map((lesson: any) => {
                const isLocked = lesson.status === 'locked'
                const isCompleted = lesson.status === 'completed'
                return (
                  <div key={lesson.id}>
                    {isLocked ? (
                      <div className="card" style={{
                        padding: '1rem 1.25rem', opacity: 0.38, cursor: 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: '1rem',
                      }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', minWidth: '1.5rem' }}>
                          {String(lesson.order_index).padStart(2, '0')}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{lesson.title}</p>
                          {lesson.subtitle && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lesson.subtitle}</p>}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🔒</span>
                      </div>
                    ) : (
                      <Link href={`/student/leccion/${lesson.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div className="card" style={{
                          padding: '1rem 1.25rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          borderColor: isCompleted ? 'var(--success)' : undefined,
                        }}>
                          <span style={{
                            fontSize: '0.7rem', fontFamily: 'var(--font-serif)', minWidth: '1.5rem',
                            color: isCompleted ? 'var(--success)' : 'var(--accent)',
                          }}>
                            {String(lesson.order_index).padStart(2, '0')}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{lesson.title}</p>
                            {lesson.subtitle && (
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{lesson.subtitle}</p>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                            {lesson.estimated_minutes && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>≈ {lesson.estimated_minutes} min</span>
                            )}
                            {isCompleted
                              ? <span className="badge badge-done">✓</span>
                              : <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>→</span>
                            }
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Curso 2 bloqueado */}
        <div className="card fade-up" style={{
          padding: '1.5rem', marginBottom: '3rem', opacity: 0.45,
          border: '0.5px dashed var(--border-strong)',
          display: 'flex', alignItems: 'center', gap: '1.25rem',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
          }}>🔒</div>
          <div style={{ flex: 1 }}>
            <p className="accent-label" style={{ marginBottom: '0.2rem', color: 'var(--text-muted)' }}>próximamente</p>
            <p style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem', fontFamily: 'var(--font-serif)' }}>
              Curso 2 — La técnica avanzada
            </p>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
              {totalCount - completedCount > 0
                ? `Completa este curso para desbloquearlo. Te quedan ${totalCount - completedCount} lección${totalCount - completedCount !== 1 ? 'es' : ''}.`
                : '¡Has completado el curso! El siguiente está en camino.'}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-serif)' }}>
              {progressPct}%
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>del curso 1</p>
          </div>
        </div>

      </main>
    </div>
  )
}