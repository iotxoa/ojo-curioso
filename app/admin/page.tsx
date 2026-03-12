import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import AdminClient from '@/components/layout/AdminClient'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/student/dashboard')

  const [{ data: submissions }, { data: students }, { data: allProgress }] = await Promise.all([
    supabase.from('submissions')
      .select('*, exercise:exercises(*, lesson:lessons(title, slug))')
      .order('submitted_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('role', 'student'),
    supabase.from('lesson_progress').select('*, lesson:lessons(title)'),
  ])

  // Por cada alumno, calcular progreso
  const studentsWithProgress = (students || []).map((s: any) => {
    const sp = (allProgress || []).filter((p: any) => p.user_id === s.id)
    return { ...s, progress: sp }
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Nav role="admin" />
      <AdminClient
        submissions={submissions || []}
        students={studentsWithProgress}
      />
    </div>
  )
}
