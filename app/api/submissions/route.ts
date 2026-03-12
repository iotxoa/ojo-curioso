import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { exercise_id, text_content } = body

  const { data, error } = await supabase.from('submissions').insert({
    user_id: user.id,
    exercise_id,
    text_content,
    status: 'submitted',
  }).select().single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Notificación por email (opcional — requiere RESEND_API_KEY)
  if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
      const { data: exercise } = await supabase.from('exercises').select('title').eq('id', exercise_id).single()

      await resend.emails.send({
        from: 'El ojo curioso <noreply@tudominio.com>',
        to: process.env.ADMIN_EMAIL,
        subject: `Nueva entrega: ${exercise?.title}`,
        html: `
          <p><strong>${profile?.full_name || profile?.email}</strong> ha entregado el ejercicio <strong>${exercise?.title}</strong>.</p>
          <blockquote>${text_content?.substring(0, 300)}${text_content?.length > 300 ? '...' : ''}</blockquote>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin">Ver en el panel de admin</a></p>
        `,
      })
    } catch (e) {
      console.error('Email error:', e)
    }
  }

  return NextResponse.json({ data })
}
