import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import LessonEditor from '@/components/admin/LessonEditor'

export default async function AdminLeccionEditorPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/student/dashboard')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!lesson) notFound()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Nav role="admin" />
      <LessonEditor lesson={lesson} />
    </div>
  )
}