import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import { CheckCircle, Clock, ChevronRight } from 'lucide-react'

export default async function EjerciciosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, exercise:exercises(*, lesson:lessons(title, slug))')
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })

  const { data: allExercises } = await supabase
    .from('exercises')
    .select('*, lesson:lessons(title, slug, published)')

  const publishedExercises = (allExercises || []).filter((e: any) => e.lesson?.published)
  const submittedIds = new Set((submissions || []).map((s: any) => s.exercise_id))
  const pending = publishedExercises.filter((e: any) => !submittedIds.has(e.id))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Nav role={profile?.role || 'student'} />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        <div className="fade-up" style={{ marginBottom: '3rem' }}>
          <p className="accent-label" style={{ marginBottom: '0.5rem' }}>tu trabajo</p>
          <h1>Ejercicios</h1>
        </div>

        {/* Pendientes */}
        {pending.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <p className="accent-label" style={{ marginBottom: '1rem' }}>pendientes</p>
            {pending.map((ex: any) => (
              <Link key={ex.id} href={`/student/leccion/${ex.lesson?.slug}`}
                style={{ textDecoration: 'none', display: 'block', marginBottom: '0.875rem' }}>
                <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{ex.title}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {ex.lesson?.title}
                      {ex.due_note && ` · ${ex.due_note}`}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Entregados */}
        {(submissions || []).length > 0 && (
          <div>
            <p className="accent-label" style={{ marginBottom: '1rem' }}>entregados</p>
            {(submissions || []).map((sub: any) => (
              <div key={sub.id} className="card" style={{ padding: '1.25rem', marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {sub.exercise?.title}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {sub.exercise?.lesson?.title} · {new Date(sub.submitted_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {sub.admin_grade && (
                      <span className="badge badge-active">{sub.admin_grade}</span>
                    )}
                    <span className={`badge ${sub.status === 'reviewed' ? 'badge-done' : 'badge-pending'}`}>
                      {sub.status === 'reviewed' ? 'revisado' : 'entregado'}
                    </span>
                  </div>
                </div>

                {sub.admin_feedback && (
                  <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '0.5px solid var(--border)' }}>
                    <p className="accent-label" style={{ marginBottom: '0.4rem' }}>feedback</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {sub.admin_feedback}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pending.length === 0 && (submissions || []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Completa tu primera lección para ver los ejercicios aquí.
            </p>
          </div>
        )}

      </main>
    </div>
  )
}