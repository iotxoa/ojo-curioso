import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import type { Module, Lesson, LessonProgress } from '@/types'

export default async function Dashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: modules }, { data: progress }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('modules').select('*, lessons(*)').eq('published', true).order('order_index'),
    supabase.from('lesson_progress').select('*').eq('user_id', user.id),
  ])

  const progressMap = new Map((progress || []).map((p: LessonProgress) => [p.lesson_id, p]))

  const allLessons = (modules || []).flatMap((m: Module) => m.lessons || [])
  const completedCount = allLessons.filter((l: Lesson) => progressMap.get(l.id)?.status === 'completed').length
  const totalCount = allLessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Determinar siguiente lección desbloqueada
  function getLessonStatus(lessonId: number, lessonIndex: number, allLessonsFlat: Lesson[]) {
    const p = progressMap.get(lessonId)
    if (p?.status === 'completed') return 'completed'
    if (lessonIndex === 0) return 'available'
    const prev = allLessonsFlat[lessonIndex - 1]
    if (progressMap.get(prev.id)?.status === 'completed') return 'available'
    return 'locked'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Nav role={profile?.role || 'student'} />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Hero */}
        <div className="fade-up" style={{ marginBottom: '3rem' }}>
          <p className="accent-label" style={{ marginBottom: '0.5rem' }}>bienvenido de nuevo</p>
          <h1 style={{ marginBottom: '0.75rem' }}>
            Hola, {profile?.full_name?.split(' ')[0] || 'fotógrafo'}
          </h1>
          <p style={{ maxWidth: '520px', fontSize: '0.95rem' }}>
            Cada lección se desvela cuando terminas la anterior. Ve a tu ritmo — no hay prisa.
          </p>
        </div>

        {/* Progress */}
        <div className="card fade-up" style={{ padding: '1.5rem', marginBottom: '2.5rem', animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <p className="accent-label">tu progreso</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {completedCount} de {totalCount} lecciones
            </p>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Módulos y lecciones */}
        {(modules || []).map((mod: Module, mi: number) => {
          const modLessons = (mod.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)

          return (
            <div key={mod.id} className="fade-up" style={{ marginBottom: '2.5rem', animationDelay: `${0.1 + mi * 0.05}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="divider" style={{ flex: 1 }} />
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Módulo {mod.order_index} — {mod.title}
                </p>
                <div className="divider" style={{ flex: 1 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>
                {modLessons.map((lesson: Lesson, li: number) => {
                  const globalIdx = allLessons.findIndex((l: Lesson) => l.id === lesson.id)
                  const status = getLessonStatus(lesson.id, globalIdx, allLessons)
                  const isLocked = status === 'locked'

                  return (
                    <div key={lesson.id}
                      className={`card ${status === 'completed' || status === 'available' ? '' : ''}`}
                      style={{
                        padding: '1.25rem',
                        opacity: isLocked ? 0.45 : 1,
                        position: 'relative',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                      }}>
                      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                        {status === 'completed' && <span className="badge badge-done">completada</span>}
                        {status === 'available' && progressMap.get(lesson.id)?.status === 'in_progress' && <span className="badge badge-active">en curso</span>}
                        {isLocked && <span className="badge badge-locked">bloqueada</span>}
                      </div>

                      <p className="accent-label" style={{ marginBottom: '0.4rem' }}>
                        lección {String(lesson.order_index).padStart(2, '0')}
                      </p>

                      {isLocked ? (
                        <>
                          <h3 style={{ fontSize: '1rem', marginBottom: '0.3rem', paddingRight: '5rem' }}>{lesson.title}</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lesson.subtitle}</p>
                        </>
                      ) : (
                        <Link href={`/student/leccion/${lesson.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                          <h3 style={{ fontSize: '1rem', marginBottom: '0.3rem', paddingRight: '5rem', color: 'var(--text-primary)' }}>{lesson.title}</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lesson.subtitle}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                            ≈ {lesson.estimated_minutes} min
                          </p>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
