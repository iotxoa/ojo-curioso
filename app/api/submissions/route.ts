// app/api/submissions/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { exercise_id, content, file_urls } = body

  // Upsert — si ya existe una entrega para este ejercicio, actualizarla
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('exercise_id', exercise_id)
    .single()

  let result
  if (existing) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        text_content: content,       // nombre real en BBDD
        file_urls: file_urls || [],
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        exercise_id,
        text_content: content,       // nombre real en BBDD
        file_urls: file_urls || [],
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  // Notificar al admin por email
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const { data: exercise } = await supabase
      .from('exercises')
      .select('title, lesson_id, lessons(title, slug)')
      .eq('id', exercise_id)
      .single()

    await fetch(`${req.nextUrl.origin}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_submission',
        student_name: profile?.full_name,
        student_email: profile?.email,
        exercise_title: exercise?.title,
        lesson_title: (exercise?.lessons as any)?.title,
        lesson_slug: (exercise?.lessons as any)?.slug,
        submission_id: result.id,
      }),
    })
  } catch (e) {
    // No bloquear si el email falla
    console.error('Email notification failed:', e)
  }

  return NextResponse.json({ submission: result })
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const exercise_id = searchParams.get('exercise_id')

  if (!exercise_id) return NextResponse.json({ error: 'exercise_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_id', exercise_id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submission: data || null })
}