'use client'
// app/admin/submissions/[id]/page.tsx
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PhotoAnnotator } from '@/components/admin/PhotoAnnotator'
import { RichTextEditor } from '@/components/lesson/RichTextEditor'
import { createClient } from '@/lib/supabase/client'

interface FileInfo {
  name: string
  url: string
  path: string
  type: string
  size: number
}

interface AnnotatedImage {
  original_url: string
  annotated_url: string
  caption?: string
}

interface Submission {
  id: string
  text_content: string
  file_urls: FileInfo[]
  admin_feedback?: string
  feedback_html?: string
  admin_grade?: string
  annotated_images?: AnnotatedImage[]
  status: string
  submitted_at: string
  reviewed_at?: string
  student_name: string
  student_email: string
  exercise_title: string
  lesson_title: string
  lesson_slug: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SubmissionReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedbackHtml, setFeedbackHtml] = useState('')
  const [annotatedImages, setAnnotatedImages] = useState<AnnotatedImage[]>([])
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('admin_submissions_view')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { router.push('/admin'); return }
        setSubmission(data as Submission)
        setFeedbackHtml(data.feedback_html || data.admin_feedback || '')
        setAnnotatedImages(data.annotated_images || [])
        setLoading(false)
      })
  }, [id])

  const handleAnnotationSave = (annotatedUrl: string, originalUrl: string) => {
    setAnnotatedImages(prev => {
      const existing = prev.findIndex(a => a.original_url === originalUrl)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], annotated_url: annotatedUrl }
        return updated
      }
      return [...prev, { original_url: originalUrl, annotated_url: annotatedUrl }]
    })
    setActiveImageIndex(null)
  }

  const handleSaveFeedback = async () => {
    setSaving(true)
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: id,
        feedback_html: feedbackHtml,
        annotated_images: annotatedImages,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const images = submission?.file_urls?.filter(f => f.type.startsWith('image/')) || []
  const otherFiles = submission?.file_urls?.filter(f => !f.type.startsWith('image/')) || []

  if (loading) {
    return (
      <div className="review-page">
        <div className="loading-state">Cargando entrega...</div>
      </div>
    )
  }

  if (!submission) return null

  return (
    <div className="review-page">
      {/* Nav */}
      <div className="review-nav">
        <button className="back-btn" onClick={() => router.push('/admin')} type="button">
          ← Panel admin
        </button>
        <div className="nav-crumbs">
          <span>{submission.module_title || ''}</span>
          <span>›</span>
          <span>{submission.lesson_title}</span>
          <span>›</span>
          <span>{submission.exercise_title}</span>
        </div>
      </div>

      {/* Header */}
      <div className="review-header">
        <div className="student-info">
          <div className="student-avatar">
            {submission.student_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="student-name">{submission.student_name}</h1>
            <p className="student-meta">
              {submission.student_email} · Entregado {formatDate(submission.submitted_at)}
            </p>
          </div>
        </div>
        <div className={`submission-status ${submission.status}`}>
          {submission.status === 'reviewed' ? '✦ Corregido' : '⟳ Pendiente'}
        </div>
      </div>

      <div className="review-body">
        {/* Left: submission content */}
        <div className="submission-panel">
          <h2 className="panel-title">Entrega del alumno</h2>

          {/* Text content */}
          {submission.text_content && (
            <div className="submission-section">
              <p className="section-label">Texto</p>
              <div
                className="submission-text"
                dangerouslySetInnerHTML={{ __html: submission.text_content }}
              />
            </div>
          )}

          {/* Image files */}
          {images.length > 0 && (
            <div className="submission-section">
              <p className="section-label">Fotos ({images.length})</p>
              <div className="images-grid">
                {images.map((img, i) => {
                  const isAnnotating = activeImageIndex === i
                  const annotated = annotatedImages.find(a => a.original_url === img.url)

                  return (
                    <div key={img.path} className="image-item">
                      {isAnnotating ? (
                        <div className="annotator-wrapper">
                          <PhotoAnnotator
                            imageUrl={img.url}
                            imageIndex={i}
                            submissionId={id}
                            existingAnnotated={annotated?.annotated_url}
                            onSave={handleAnnotationSave}
                          />
                          <button
                            className="cancel-ann"
                            onClick={() => setActiveImageIndex(null)}
                            type="button"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <img
                            src={annotated ? annotated.annotated_url : img.url}
                            alt={img.name}
                            className="submission-img"
                          />
                          <div className="img-overlay">
                            <button
                              className="annotate-btn"
                              onClick={() => setActiveImageIndex(i)}
                              type="button"
                            >
                              ◈ Anotar
                            </button>
                            {annotated && (
                              <span className="annotated-tag">✓ Anotada</span>
                            )}
                          </div>
                        </>
                      )}
                      <p className="img-name">{img.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Other files */}
          {otherFiles.length > 0 && (
            <div className="submission-section">
              <p className="section-label">Archivos</p>
              <div className="other-files">
                {otherFiles.map(f => (
                  <a
                    key={f.path}
                    href={f.url}
                    download={f.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    <span className="file-link-icon">📄</span>
                    <span className="file-link-name">{f.name}</span>
                    <span className="file-link-size">{formatSize(f.size)}</span>
                    <span className="file-link-arrow">↓</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: feedback panel */}
        <div className="feedback-panel">
          <h2 className="panel-title">Tu feedback</h2>

          {/* Annotated images summary */}
          {annotatedImages.length > 0 && (
            <div className="annotated-summary">
              <p className="section-label">
                {annotatedImages.length} foto{annotatedImages.length !== 1 ? 's' : ''} anotada{annotatedImages.length !== 1 ? 's' : ''}
              </p>
              <div className="ann-thumbs">
                {annotatedImages.map((a, i) => (
                  <img key={i} src={a.annotated_url} alt={`Anotada ${i + 1}`} className="ann-thumb" />
                ))}
              </div>
            </div>
          )}

          {/* Rich text feedback */}
          <div className="feedback-editor-wrapper">
            <RichTextEditor
              value={feedbackHtml}
              onChange={setFeedbackHtml}
              placeholder="Escribe tu feedback aquí. Sé específico: qué funciona bien, qué mejorar, qué ejercitar..."
              minHeight={280}
            />
          </div>

          <button
            className={`send-feedback-btn ${saving ? 'loading' : ''} ${saved ? 'success' : ''}`}
            onClick={handleSaveFeedback}
            disabled={saving}
            type="button"
          >
            {saving
              ? 'Guardando y enviando...'
              : saved
              ? '✓ Feedback enviado'
              : submission.status === 'reviewed'
              ? 'Actualizar feedback'
              : 'Guardar y notificar al alumno'}
          </button>

          <p className="send-note">
            El alumno recibirá un email avisando de que tiene feedback nuevo.
          </p>
        </div>
      </div>

      <style jsx>{`
        .review-page {
          min-height: 100vh;
          background: #0D0A06;
          padding: 24px;
          font-family: 'Lato', sans-serif;
        }
        .loading-state {
          color: rgba(253,246,236,0.4); text-align: center;
          padding: 80px; font-size: 16px;
        }
        .review-nav {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 32px; flex-wrap: wrap;
        }
        .back-btn {
          background: none; border: 1px solid rgba(196,151,90,0.25);
          color: rgba(196,151,90,0.7); border-radius: 4px;
          padding: 8px 16px; cursor: pointer; font-size: 13px;
          font-family: 'Lato', sans-serif; transition: all 0.15s;
        }
        .back-btn:hover { border-color: #C4975A; color: #C4975A; }
        .nav-crumbs {
          display: flex; gap: 8px; align-items: center;
          font-size: 13px; color: rgba(253,246,236,0.35);
        }
        .review-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-bottom: 32px;
          background: rgba(42,31,16,0.5); border: 1px solid rgba(196,151,90,0.2);
          border-radius: 8px; padding: 24px;
        }
        .student-info { display: flex; align-items: center; gap: 16px; }
        .student-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, #C4975A, #8A6030);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; color: #1A1208; font-weight: 700;
          flex-shrink: 0;
        }
        .student-name {
          margin: 0 0 4px; font-size: 22px; font-weight: normal;
          color: #FDF6EC; font-family: 'Playfair Display', serif;
        }
        .student-meta { margin: 0; font-size: 13px; color: rgba(253,246,236,0.45); }
        .submission-status {
          font-size: 12px; letter-spacing: 2px; padding: 8px 16px;
          border-radius: 20px; white-space: nowrap;
        }
        .submission-status.reviewed {
          background: rgba(196,151,90,0.15); color: #C4975A;
          border: 1px solid rgba(196,151,90,0.3);
        }
        .submission-status.submitted {
          background: rgba(100,120,80,0.15); color: #8BAF70;
          border: 1px solid rgba(100,120,80,0.3);
        }
        .review-body {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 24px; align-items: start;
        }
        @media (max-width: 900px) {
          .review-body { grid-template-columns: 1fr; }
        }
        .submission-panel, .feedback-panel {
          background: rgba(42,31,16,0.4); border: 1px solid rgba(196,151,90,0.2);
          border-radius: 8px; padding: 28px;
          display: flex; flex-direction: column; gap: 24px;
        }
        .panel-title {
          margin: 0; font-size: 13px; letter-spacing: 3px;
          text-transform: uppercase; color: rgba(196,151,90,0.6);
          font-family: 'Lato', sans-serif; font-weight: 400;
        }
        .submission-section { display: flex; flex-direction: column; gap: 12px; }
        .section-label {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(253,246,236,0.35); margin: 0;
        }
        .submission-text {
          color: #D4C4A0; font-size: 15px; line-height: 1.75;
          background: rgba(26,18,8,0.5); border-radius: 6px; padding: 16px 20px;
          border: 1px solid rgba(196,151,90,0.15);
        }
        .submission-text ul { padding-left: 20px; }
        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .image-item { display: flex; flex-direction: column; gap: 6px; }
        .annotator-wrapper { display: flex; flex-direction: column; gap: 8px; }
        .submission-img {
          width: 100%; aspect-ratio: 4/3; object-fit: cover;
          border-radius: 6px; border: 1px solid rgba(196,151,90,0.2);
          display: block;
        }
        .img-overlay {
          display: flex; align-items: center; gap: 8px;
        }
        .annotate-btn {
          background: rgba(196,151,90,0.15); border: 1px solid rgba(196,151,90,0.3);
          color: #C4975A; border-radius: 4px; padding: 6px 12px;
          cursor: pointer; font-size: 12px; letter-spacing: 0.5px;
          font-family: 'Lato', sans-serif; transition: all 0.15s;
        }
        .annotate-btn:hover { background: rgba(196,151,90,0.25); }
        .annotated-tag {
          font-size: 11px; color: #8BAF70; letter-spacing: 0.5px;
        }
        .cancel-ann {
          background: none; border: 1px solid rgba(232,139,106,0.3);
          color: rgba(232,139,106,0.7); border-radius: 4px;
          padding: 6px 12px; cursor: pointer; font-size: 12px;
          font-family: 'Lato', sans-serif;
        }
        .img-name {
          font-size: 11px; color: rgba(253,246,236,0.3); margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .other-files { display: flex; flex-direction: column; gap: 8px; }
        .file-link {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: rgba(26,18,8,0.5);
          border: 1px solid rgba(196,151,90,0.15); border-radius: 6px;
          text-decoration: none; transition: border-color 0.15s;
        }
        .file-link:hover { border-color: rgba(196,151,90,0.35); }
        .file-link-icon { font-size: 18px; flex-shrink: 0; }
        .file-link-name {
          flex: 1; font-size: 14px; color: #FDF6EC;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .file-link-size { font-size: 11px; color: rgba(253,246,236,0.35); }
        .file-link-arrow { font-size: 14px; color: #C4975A; }
        .annotated-summary { display: flex; flex-direction: column; gap: 10px; }
        .ann-thumbs { display: flex; gap: 8px; flex-wrap: wrap; }
        .ann-thumb {
          width: 56px; height: 56px; object-fit: cover; border-radius: 4px;
          border: 1px solid rgba(139,175,112,0.4);
        }
        .feedback-editor-wrapper { flex: 1; }
        .send-feedback-btn {
          width: 100%; padding: 15px;
          background: #C4975A; color: #1A1208;
          border: none; border-radius: 6px;
          font-size: 13px; letter-spacing: 2px; text-transform: uppercase;
          font-family: 'Lato', sans-serif; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        .send-feedback-btn:hover:not(:disabled) { background: #D4A76A; }
        .send-feedback-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .send-feedback-btn.success {
          background: rgba(100,120,80,0.3); color: #8BAF70;
          border: 1px solid rgba(100,120,80,0.4);
        }
        .send-note {
          font-size: 12px; color: rgba(253,246,236,0.3); margin: 0;
          text-align: center;
        }
      `}</style>
    </div>
  )
}