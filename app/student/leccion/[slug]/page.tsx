import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import LessonClient from '@/components/lesson/LessonClient'

export default async function LessonPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: lesson }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('lessons').select('*').eq('slug', params.slug).eq('published', true).single(),
  ])

  if (!lesson) notFound()

  const [{ data: questions }, { data: exercises }, { data: progress }, { data: quizResult }, { data: submissions }] = await Promise.all([
    supabase.from('quiz_questions').select('*').eq('lesson_id', lesson.id).order('order_index'),
    supabase.from('exercises').select('*').eq('lesson_id', lesson.id),
    supabase.from('lesson_progress').select('*').eq('user_id', user.id).eq('lesson_id', lesson.id).single(),
    supabase.from('quiz_results').select('*').eq('user_id', user.id).eq('lesson_id', lesson.id).single(),
    supabase.from('submissions').select('*').eq('user_id', user.id),
  ])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Nav role={profile?.role || 'student'} />
      <LessonClient
        lesson={lesson}
        questions={questions || []}
        exercises={exercises || []}
        progress={progress}
        quizResult={quizResult}
        submissions={submissions || []}
        userId={user.id}
      />
    </div>
  )
}
