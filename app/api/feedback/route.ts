// app/api/feedback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verificar que es admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { submission_id, feedback_html, annotated_images } = body

  // Obtener la submission para saber a quién notificar
  const { data: submission } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles!submissions_user_id_fkey(full_name, email),
      exercises(title, lesson_id, lessons(title, slug))
    `)
    .eq('id', submission_id)
    .single()

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // Guardar feedback
  const { data, error } = await supabase
    .from('submissions')
    .update({
      feedback_html,
      annotated_images: annotated_images || [],
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),     // nombre real en BBDD
      admin_feedback: feedback_html?.replace(/<[^>]*>/g, '') || '',  // nombre real en BBDD
    })
    .eq('id', submission_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notificar al alumno
  try {
    const student = (submission as any).profiles
    const exercise = (submission as any).exercises
    const lesson = exercise?.lessons

    await fetch(`${req.nextUrl.origin}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'feedback_ready',
        student_name: student?.full_name,
        student_email: student?.email,
        exercise_title: exercise?.title,
        lesson_title: lesson?.title,
        lesson_slug: lesson?.slug,
        submission_id,
      }),
    })
  } catch (e) {
    console.error('Email notification failed:', e)
  }

  return NextResponse.json({ submission: data })
}