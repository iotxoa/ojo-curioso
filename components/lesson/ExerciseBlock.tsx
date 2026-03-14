'use client'
// components/lesson/ExerciseBlock.tsx
import { useState, useEffect } from 'react'
import { RichTextEditor } from './RichTextEditor'
import { FileUploader } from './FileUploader'
import { FeedbackView } from './FeedbackView'

interface Exercise {
  id: string
  title: string
  description: string
  exercise_type?: string
}

interface Submission {
  id: string
  content: string
  file_urls: Array<{ name: string; url: string; path: string; type: string; size: number }>
  feedback?: string
  feedback_html?: string
  annotated_images?: Array<{ original_url: string; annotated_url: string }>
  status: 'pending' | 'submitted' | 'reviewed'
  submitted_at?: string
  reviewed_at?: string      // nombre real en BBDD
}

interface ExerciseBlockProps {
  exercise: Exercise
  lessonTitle: string
  lessonSlug: string
  userId: string
}

type Tab = 'text' | 'files'

export function ExerciseBlock({ exercise, lessonTitle, lessonSlug, userId }: ExerciseBlockProps) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('text')
  const [textContent, setTextContent] = useState('')
  const [files, setFiles] = useState<Submission['file_urls']>([])

  useEffect(() => {
    fetch(`/api/submissions?exercise_id=${exercise.id}`)
      .then(r => r.json())
      .then(({ submission: sub }) => {
        if (sub) {
          setSubmission(sub)
          setTextContent(sub.text_content || '')   // nombre real en BBDD
          setFiles(sub.file_urls || [])
        }
        setLoading(false)
      })
  }, [exercise.id])

  const handleSubmit = async () => {
    setSaving(true)
    setSaved(false)

    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_id: exercise.id,
        content: textContent,
        file_urls: files,
      }),
    })

    const { submission: sub } = await res.json()
    setSubmission(sub)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const hasContent = textContent.replace(/<[^>]*>/g, '').trim().length > 0 || files.length > 0
  const isReviewed = submission?.status === 'reviewed'
  const isSubmitted = submission?.status === 'submitted'

  if (loading) {
    return (
      <div className="exercise-block">
        <div className="exercise-skeleton" />
      </div>
    )
  }

  return (
    <div className="exercise-block">
      {/* Header */}
      <div className="exercise-header">
        <div className="exercise-badge">
          <span className="badge-icon">◈</span>
          <span className="badge-text">Ejercicio</span>
        </div>
        {isReviewed && (
          <div className="status-badge reviewed">✦ Corregido</div>
        )}
        {isSubmitted && (
          <div className="status-badge submitted">⟳ Entregado — pendiente de revisión</div>
        )}
      </div>

      {/* Title */}
      <h3 className="exercise-title">{exercise.title}</h3>

      {/* Instructions toggle */}
      <button
        className="instructions-toggle"
        onClick={() => setInstructionsOpen(!instructionsOpen)}
        type="button"
      >
        <span>{instructionsOpen ? '▾' : '▸'}</span>
        <span>Ver instrucciones</span>
      </button>

      {instructionsOpen && (
        <div className="instructions-body">
          <p>{exercise.description}</p>
          <div className="lesson-ref">
            <span className="ref-label">Material de referencia:</span>
            <a href={`/student/leccion/${lessonSlug}`} className="ref-link">
              Lección: {lessonTitle} →
            </a>
          </div>
        </div>
      )}

      {/* Si ya hay feedback, mostrarlo */}
      {isReviewed && submission && (
        <FeedbackView
          feedbackHtml={submission.feedback_html || submission.admin_feedback || ''}
          annotatedImages={submission.annotated_images || []}
        />
      )}

      {/* Editor — siempre visible para reeditar */}
      <div className="editor-section">
        <div className="editor-label">
          {isReviewed ? 'Tu entrega (puedes actualizarla)' : 'Tu respuesta'}
        </div>

        {/* Tabs */}
        <div className="editor-tabs">
          <button
            className={`editor-tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
            type="button"
          >
            ✏ Texto
          </button>
          <button
            className={`editor-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
            type="button"
          >
            📎 Archivos {files.length > 0 && <span className="file-count">{files.length}</span>}
          </button>
        </div>

        {activeTab === 'text' && (
          <RichTextEditor
            value={textContent}
            onChange={setTextContent}
            placeholder="Escribe tu reflexión, describe tu proceso, comparte qué aprendiste..."
            minHeight={200}
          />
        )}

        {activeTab === 'files' && (
          <FileUploader
            userId={userId}
            exerciseId={exercise.id}
            existingFiles={files}
            onFilesChange={setFiles}
          />
        )}

        {/* Submit button */}
        <div className="submit-row">
          <button
            className={`submit-btn ${!hasContent || saving ? 'disabled' : ''} ${saved ? 'success' : ''}`}
            onClick={handleSubmit}
            disabled={!hasContent || saving}
            type="button"
          >
            {saving ? 'Guardando...' : saved ? '✓ Entregado' : isSubmitted || isReviewed ? 'Actualizar entrega' : 'Entregar ejercicio'}
          </button>
          {(isSubmitted || isReviewed) && submission?.submitted_at && (
            <span className="submit-date">
              Última entrega: {new Date(submission.submitted_at).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .exercise-block {
          background: linear-gradient(135deg, rgba(42,31,16,0.95) 0%, rgba(26,18,8,0.95) 100%);
          border: 1px solid rgba(196, 151, 90, 0.35);
          border-radius: 10px;
          padding: 32px;
          margin: 40px 0;
          position: relative;
        }
        .exercise-block::before {
          content: '';
          position: absolute;
          top: 0; left: 32px; right: 32px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #C4975A, transparent);
        }
        .exercise-skeleton {
          height: 200px;
          background: rgba(196,151,90,0.05);
          border-radius: 6px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .exercise-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
        }
        .exercise-badge {
          display: flex; align-items: center; gap: 6px;
        }
        .badge-icon { color: #C4975A; font-size: 16px; }
        .badge-text {
          font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
          color: #C4975A; font-family: 'Lato', sans-serif;
        }
        .status-badge {
          font-size: 11px; letter-spacing: 1.5px;
          padding: 4px 10px; border-radius: 20px;
          font-family: 'Lato', sans-serif;
        }
        .status-badge.reviewed {
          background: rgba(196,151,90,0.15); color: #C4975A;
          border: 1px solid rgba(196,151,90,0.3);
        }
        .status-badge.submitted {
          background: rgba(100,120,80,0.15); color: #8BAF70;
          border: 1px solid rgba(100,120,80,0.3);
        }
        .exercise-title {
          font-size: 22px; font-weight: normal; color: #FDF6EC;
          font-family: 'Playfair Display', serif; margin: 0 0 20px;
          line-height: 1.3;
        }
        .instructions-toggle {
          display: flex; align-items: center; gap: 8px;
          background: none; border: none;
          color: rgba(196,151,90,0.8); cursor: pointer;
          font-size: 13px; letter-spacing: 1px;
          font-family: 'Lato', sans-serif;
          padding: 0; margin-bottom: 16px;
          transition: color 0.2s;
        }
        .instructions-toggle:hover { color: #C4975A; }
        .instructions-body {
          background: rgba(26,18,8,0.6);
          border: 1px solid rgba(196,151,90,0.15);
          border-radius: 6px;
          padding: 20px 24px;
          margin-bottom: 24px;
        }
        .instructions-body p {
          color: #D4C4A0; font-size: 15px; line-height: 1.7;
          font-family: 'Lato', sans-serif; margin: 0 0 16px;
        }
        .lesson-ref {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .ref-label {
          font-size: 12px; color: rgba(253,246,236,0.4);
          font-family: 'Lato', sans-serif; letter-spacing: 0.5px;
        }
        .ref-link {
          font-size: 13px; color: #C4975A;
          font-family: 'Lato', sans-serif;
          text-decoration: none; transition: opacity 0.2s;
        }
        .ref-link:hover { opacity: 0.7; }
        .editor-section { display: flex; flex-direction: column; gap: 0; }
        .editor-label {
          font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(253,246,236,0.5); font-family: 'Lato', sans-serif;
          margin-bottom: 12px;
        }
        .editor-tabs {
          display: flex; gap: 0; margin-bottom: 12px;
          border-bottom: 1px solid rgba(196,151,90,0.2);
        }
        .editor-tab {
          padding: 10px 20px; background: none; border: none;
          color: rgba(196,151,90,0.5); cursor: pointer;
          font-size: 13px; font-family: 'Lato', sans-serif;
          letter-spacing: 0.5px;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.15s;
          display: flex; align-items: center; gap: 6px;
        }
        .editor-tab:hover { color: #C4975A; }
        .editor-tab.active {
          color: #C4975A;
          border-bottom-color: #C4975A;
        }
        .file-count {
          background: #C4975A; color: #1A1208;
          font-size: 10px; font-weight: 700;
          width: 18px; height: 18px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .submit-row {
          display: flex; align-items: center; gap: 16px;
          margin-top: 16px; flex-wrap: wrap;
        }
        .submit-btn {
          padding: 13px 28px;
          background: #C4975A; color: #1A1208;
          border: none; border-radius: 4px;
          font-size: 13px; letter-spacing: 2px; text-transform: uppercase;
          font-family: 'Lato', sans-serif; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        .submit-btn:hover:not(.disabled) { background: #D4A76A; }
        .submit-btn.disabled { opacity: 0.4; cursor: not-allowed; }
        .submit-btn.success {
          background: rgba(100,120,80,0.3); color: #8BAF70;
          border: 1px solid rgba(100,120,80,0.4);
        }
        .submit-date {
          font-size: 12px; color: rgba(253,246,236,0.35);
          font-family: 'Lato', sans-serif;
        }
      `}</style>
    </div>
  )
}