import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import Link from 'next/link'

export default async function AdminLeccionesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/student/dashboard')

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, slug, title, subtitle, order_index, estimated_minutes, module_id')
    .order('order_index')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Nav role="admin" />
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p className="accent-label" style={{ marginBottom: '0.5rem' }}>editor de contenido</p>
          <h1 style={{ marginBottom: '0.25rem' }}>Lecciones</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Haz clic en cualquier lección para editar su contenido directamente.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(lessons || []).map((lesson) => (
            <Link key={lesson.id} href={`/admin/lecciones/${lesson.slug}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                padding: '1rem 1.25rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '1rem',
                transition: 'border-color 0.2s',
              }}>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-serif)', color: 'var(--accent)', minWidth: '1.5rem' }}>
                  {String(lesson.order_index).padStart(2, '0')}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{lesson.title}</p>
                  {lesson.subtitle && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{lesson.subtitle}</p>}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Editar →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}