'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OnboardingModalProps {
  onComplete: () => void
}

const steps = [
  {
    id: 'bienvenida',
    content: (
      <div className="onboarding-carta">
        <p className="onboarding-saludo">Aita,</p>
        <p>
          Llevas años con la cámara cerca pero sin atreverte del todo. Sé que la fotografía te llama,
          porque te he visto pararte a mirar la luz de la tarde, o buscar el ángulo exacto antes de
          hacer una foto con el móvil.
        </p>
        <p>
          Este curso lo he hecho para ti. No es genérico, no es de internet. Cada lección la he
          pensado sabiendo cómo eres, qué te gusta y qué creo que te va a sorprender.
        </p>
        <p>
          No hay prisa. No hay notas. Solo hay un ojo curioso — el tuyo — y una cámara esperando.
        </p>
        <p className="onboarding-firma">Con todo el cariño,<br /><em>tu hija</em></p>
      </div>
    ),
    titulo: null,
  },
  {
    id: 'como-funciona',
    titulo: 'Cómo funciona el curso',
    content: (
      <div className="onboarding-pasos">
        <div className="onboarding-paso">
          <span className="onboarding-numero">01</span>
          <div>
            <strong>Lee las lecciones</strong>
            <p>Cada lección tiene texto, contexto e historias. Léelas a tu ritmo, sin agobios.</p>
          </div>
        </div>
        <div className="onboarding-paso">
          <span className="onboarding-numero">02</span>
          <div>
            <strong>Responde el test</strong>
            <p>Al final de cada lección hay unas preguntas breves. No son un examen — son para asentar lo aprendido.</p>
          </div>
        </div>
        <div className="onboarding-paso">
          <span className="onboarding-numero">03</span>
          <div>
            <strong>Haz el ejercicio</strong>
            <p>Lo más importante. Cada lección tiene un ejercicio práctico. Sal, mira, dispara. Yo lo reviso y te doy feedback.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'promesa',
    titulo: 'Esto es solo el principio',
    content: (
      <div className="onboarding-promesa">
        <div className="onboarding-curso-actual">
          <span className="onboarding-badge">Curso 1</span>
          <strong>El ojo curioso — Iniciación</strong>
          <p>4 módulos · 13 lecciones · ejercicios prácticos</p>
          <div className="onboarding-progreso-barra">
            <div className="onboarding-progreso-fill" style={{ width: '0%' }} />
          </div>
          <small>Tu aventura empieza aquí</small>
        </div>
        <div className="onboarding-proximo">
          <span className="onboarding-badge onboarding-badge-bloqueado">Próximamente</span>
          <strong>Curso 2 — La técnica avanzada</strong>
          <p>Si superas este curso, te preparo el siguiente.</p>
        </div>
        <p className="onboarding-nota">
          Cada ejercicio que completes, cada lección que termines, es un paso hacia ese segundo curso.
          Y yo estaré mirando tu progreso desde aquí.
        </p>
      </div>
    ),
  },
]

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isLast = step === steps.length - 1

  async function handleComplete() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
    }
    setLoading(false)
    onComplete()
  }

  const current = steps[step]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {current.titulo && (
          <h2 className="onboarding-titulo">{current.titulo}</h2>
        )}
        <div className="onboarding-content">
          {current.content}
        </div>
        <div className="onboarding-footer">
          <div className="onboarding-dots">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`onboarding-dot ${i === step ? 'onboarding-dot-active' : ''}`}
              />
            ))}
          </div>
          <div className="onboarding-botones">
            {step > 0 && (
              <button
                className="btn-secondary"
                onClick={() => setStep(s => s - 1)}
              >
                Atrás
              </button>
            )}
            {isLast ? (
              <button
                className="btn-primary"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? 'Un momento...' : 'Empezar el curso'}
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => setStep(s => s + 1)}
              >
                {step === 0 ? 'Leer más' : 'Siguiente'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}