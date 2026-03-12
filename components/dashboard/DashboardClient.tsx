'use client'

import { useState } from 'react'
import OnboardingModal from '@/components/onboarding/OnboardingModal'

interface DashboardClientProps {
  showOnboarding: boolean
  progressPct: number
  completedCount: number
  totalCount: number
}

export default function DashboardClient({
  showOnboarding,
  progressPct,
  completedCount,
  totalCount,
}: DashboardClientProps) {
  const [onboardingDone, setOnboardingDone] = useState(!showOnboarding)

  return (
    <>
      {!onboardingDone && (
        <OnboardingModal onComplete={() => setOnboardingDone(true)} />
      )}

      {/* Próximo curso — bloqueado */}
      <div className="card fade-up" style={{
        padding: '1.5rem',
        marginTop: '1rem',
        opacity: 0.5,
        border: '0.5px dashed var(--border-strong)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'var(--bg-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0,
        }}>
          🔒
        </div>
        <div style={{ flex: 1 }}>
          <p className="accent-label" style={{ marginBottom: '0.25rem', color: 'var(--text-muted)' }}>próximamente</p>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Curso 2 — La técnica avanzada</strong>
          </p>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
            Completa este curso para desbloquearlo. {totalCount - completedCount > 0
              ? `Te quedan ${totalCount - completedCount} lección${totalCount - completedCount !== 1 ? 'es' : ''}.`
              : '¡Ya casi estás!'}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-serif)' }}>
            {progressPct}%
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>completado</p>
        </div>
      </div>
    </>
  )
}