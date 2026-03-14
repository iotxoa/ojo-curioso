// app/api/notify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ojocurioso.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'El Ojo Curioso <hola@ojocurioso.com>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ojo-curioso.vercel.app'

// ⚡ Cambiar a 'true' en Vercel el lunes cuando quieras activar emails al alumno
const STUDENT_EMAIL_ENABLED = process.env.STUDENT_EMAIL_ENABLED === 'true'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, ...data } = body

    if (type === 'new_submission') {
      // Siempre va a ti (admin) — nunca al alumno
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `📷 Nueva entrega: ${data.exercise_title}`,
        html: buildAdminEmail(data, BASE_URL),
      })
    } else if (type === 'feedback_ready') {
      // Solo llega al alumno si STUDENT_EMAIL_ENABLED=true
      if (!STUDENT_EMAIL_ENABLED) {
        console.log('[notify] Student emails disabled — skipping')
        return NextResponse.json({ ok: true, skipped: true })
      }
      if (!data.student_email) {
        return NextResponse.json({ error: 'No student email' }, { status: 400 })
      }
      await resend.emails.send({
        from: FROM_EMAIL,
        to: data.student_email,
        subject: `✦ Tienes feedback en El Ojo Curioso`,
        html: buildStudentEmail(data, BASE_URL),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function emailBase(content: string) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>El Ojo Curioso</title></head><body style="margin:0;padding:0;background-color:#1A1208;font-family:'Georgia',serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1208;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;"><tr><td style="padding-bottom:32px;text-align:center;"><span style="font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#C4975A;">✦ &nbsp; El Ojo Curioso &nbsp; ✦</span></td></tr><tr><td style="background-color:#2A1F10;border-radius:8px;border:1px solid #3D2E18;overflow:hidden;"><div style="height:3px;background:linear-gradient(90deg,#C4975A,#E8C07A,#C4975A);"></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:40px 48px;">${content}</td></tr></table><div style="height:1px;background:#3D2E18;margin:0 48px;"></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 48px;text-align:center;"><span style="font-size:12px;color:#7A6040;letter-spacing:1px;">Curso de iniciación a la fotografía · 4 módulos · 13 lecciones</span></td></tr></table></td></tr></table></td></tr></table></body></html>`
}

function buildAdminEmail(data: any, baseUrl: string) {
  const adminUrl = `${baseUrl}/admin/submissions/${data.submission_id}`
  return emailBase(`
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:normal;color:#FDF6EC;font-family:'Georgia',serif;">Nueva entrega</h1>
    <p style="margin:0 0 32px;font-size:14px;color:#C4975A;letter-spacing:2px;text-transform:uppercase;">Ejercicio completado</p>
    <p style="margin:0 0 24px;font-size:16px;color:#D4C4A0;line-height:1.6;"><strong style="color:#FDF6EC;">${data.student_name}</strong> ha entregado el ejercicio de la lección <em>${data.lesson_title}</em>.</p>
    <div style="background:#1A1208;border-radius:6px;border-left:3px solid #C4975A;padding:20px 24px;margin:0 0 32px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7A6040;">Ejercicio</p>
      <p style="margin:0;font-size:18px;color:#FDF6EC;">${data.exercise_title}</p>
    </div>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#C4975A;border-radius:4px;"><a href="${adminUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#1A1208;text-decoration:none;font-weight:bold;">Ver entrega y corregir →</a></td></tr></table>
  `)
}

function buildStudentEmail(data: any, baseUrl: string) {
  const lessonUrl = `${baseUrl}/student/leccion/${data.lesson_slug}`
  const firstName = data.student_name?.split(' ')[0] || 'Fotógrafo'
  return emailBase(`
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:normal;color:#FDF6EC;font-family:'Georgia',serif;">Tienes feedback</h1>
    <p style="margin:0 0 32px;font-size:14px;color:#C4975A;letter-spacing:2px;text-transform:uppercase;">Tu ejercicio ha sido corregido</p>
    <p style="margin:0 0 24px;font-size:16px;color:#D4C4A0;line-height:1.6;">Hola, <strong style="color:#FDF6EC;">${firstName}</strong>. He revisado tu ejercicio <em>${data.exercise_title}</em> de la lección <em>${data.lesson_title}</em>.</p>
    <p style="margin:0 0 32px;font-size:15px;color:#D4C4A0;line-height:1.6;">Entra en la plataforma para ver el feedback detallado.</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr><td style="background:#C4975A;border-radius:4px;"><a href="${lessonUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#1A1208;text-decoration:none;font-weight:bold;">Ver mi feedback →</a></td></tr></table>
    <p style="margin:0;font-size:14px;color:#7A6040;font-style:italic;">Sigue mirando. Sigue disparando.</p>
  `)
}