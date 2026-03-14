'use client'
// components/student/FeedbackBanner.tsx
// Añadir en el dashboard del alumno cuando tiene correcciones nuevas

import Link from 'next/link'

interface FeedbackBannerProps {
  count: number
  // Array de { lessonSlug, exerciseTitle } para enlazar directamente
  items: Array<{
    lessonSlug: string
    lessonTitle: string
    exerciseTitle: string
  }>
}

export function FeedbackBanner({ count, items }: FeedbackBannerProps) {
  if (count === 0) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(196,151,90,0.15) 0%, rgba(196,151,90,0.08) 100%)',
      border: '1px solid rgba(196,151,90,0.45)',
      borderRadius: '10px',
      padding: '1.25rem 1.5rem',
      marginBottom: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Línea dorada arriba */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, #C4975A, transparent)',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Icono */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(196,151,90,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', color: 'var(--accent)',
          border: '1px solid rgba(196,151,90,0.3)',
        }}>
          ✦
        </div>

        <div style={{ flex: 1 }}>
          <p style={{
            margin: '0 0 0.35rem',
            fontSize: '1rem',
            color: 'var(--accent)',
            fontFamily: 'var(--font-serif)',
          }}>
            {count === 1
              ? 'Tienes una corrección nueva'
              : `Tienes ${count} correcciones nuevas`}
          </p>
          <p style={{
            margin: '0 0 1rem',
            fontSize: '0.83rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Tu instructor ha revisado tu trabajo. Entra en la lección para ver el feedback.
          </p>

          {/* Lista de ejercicios con feedback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {items.map((item, i) => (
              <Link
                key={i}
                href={`/student/leccion/${item.lessonSlug}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.83rem', color: 'var(--accent)',
                  textDecoration: 'none',
                  width: 'fit-content',
                }}
              >
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'var(--accent)', flexShrink: 0,
                }} />
                {item.exerciseTitle}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  — {item.lessonTitle}
                </span>
                <span>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}