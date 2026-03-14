'use client'
// components/lesson/FeedbackView.tsx
import { useState } from 'react'

interface AnnotatedImage {
  original_url: string
  annotated_url: string
  caption?: string
}

interface FeedbackViewProps {
  feedbackHtml: string
  annotatedImages: AnnotatedImage[]
}

export function FeedbackView({ feedbackHtml, annotatedImages }: FeedbackViewProps) {
  const [viewMode, setViewMode] = useState<Record<number, 'annotated' | 'original'>>({})

  const toggleMode = (index: number) => {
    setViewMode(prev => ({
      ...prev,
      [index]: prev[index] === 'original' ? 'annotated' : 'original'
    }))
  }

  if (!feedbackHtml && annotatedImages.length === 0) return null

  return (
    <div className="feedback-view">
      {/* Header */}
      <div className="feedback-header">
        <div className="feedback-badge">
          <span>✦</span>
          <span>Feedback de tu instructor</span>
        </div>
      </div>

      {/* Text feedback */}
      {feedbackHtml && (
        <div
          className="feedback-content"
          dangerouslySetInnerHTML={{ __html: feedbackHtml }}
        />
      )}

      {/* Annotated images */}
      {annotatedImages.length > 0 && (
        <div className="annotated-section">
          <p className="annotated-label">
            {annotatedImages.length === 1
              ? 'Tu foto con anotaciones:'
              : `${annotatedImages.length} fotos con anotaciones:`}
          </p>
          <div className="annotated-grid">
            {annotatedImages.map((img, i) => {
              const isOriginal = viewMode[i] === 'original'
              const src = isOriginal ? img.original_url : img.annotated_url
              return (
                <div key={i} className="annotated-item">
                  <div className="annotated-img-wrapper">
                    <img src={src} alt={`Foto ${i + 1}`} className="annotated-img" />
                  </div>
                  {img.caption && (
                    <p className="annotated-caption">{img.caption}</p>
                  )}
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => toggleMode(i)}
                  >
                    {isOriginal ? '◈ Ver con anotaciones' : '⌾ Ver original'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .feedback-view {
          background: linear-gradient(135deg, rgba(40,55,30,0.3) 0%, rgba(26,18,8,0.5) 100%);
          border: 1px solid rgba(139,175,112,0.3);
          border-radius: 8px;
          padding: 28px;
          margin-bottom: 28px;
        }
        .feedback-header { margin-bottom: 20px; }
        .feedback-badge {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; letter-spacing: 2.5px; text-transform: uppercase;
          color: #8BAF70; font-family: 'Lato', sans-serif;
        }
        .feedback-content {
          color: #D4E8C4; font-size: 15px; line-height: 1.75;
          font-family: 'Lato', sans-serif;
          border-bottom: 1px solid rgba(139,175,112,0.15);
          padding-bottom: 20px; margin-bottom: 20px;
        }
        .feedback-content:last-child {
          border-bottom: none; margin-bottom: 0; padding-bottom: 0;
        }
        .feedback-content strong { color: #FDF6EC; }
        .feedback-content em { color: #B4D4A0; }
        .feedback-content ul { padding-left: 20px; }
        .feedback-content li { margin-bottom: 6px; }
        .annotated-section {}
        .annotated-label {
          font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;
          color: rgba(139,175,112,0.7); font-family: 'Lato', sans-serif;
          margin: 0 0 16px;
        }
        .annotated-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .annotated-item {
          display: flex; flex-direction: column; gap: 8px;
        }
        .annotated-img-wrapper {
          border-radius: 6px; overflow: hidden;
          border: 1px solid rgba(139,175,112,0.25);
          background: #0D0A06;
        }
        .annotated-img {
          width: 100%; display: block;
          transition: opacity 0.2s;
        }
        .annotated-caption {
          font-size: 13px; color: rgba(212,228,196,0.7);
          font-family: 'Lato', sans-serif; margin: 0;
          font-style: italic;
        }
        .toggle-btn {
          background: none; border: 1px solid rgba(139,175,112,0.3);
          color: #8BAF70; border-radius: 4px;
          padding: 7px 14px; cursor: pointer;
          font-size: 12px; letter-spacing: 1px;
          font-family: 'Lato', sans-serif;
          transition: all 0.15s; align-self: flex-start;
        }
        .toggle-btn:hover {
          background: rgba(139,175,112,0.1);
          border-color: #8BAF70;
        }
      `}</style>
    </div>
  )
}
