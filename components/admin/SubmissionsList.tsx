'use client'
// components/admin/SubmissionsList.tsx
// Añadir esto en app/admin/page.tsx o como componente separado

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SubmissionRow {
  id: string
  student_name: string
  exercise_title: string
  lesson_title: string
  module_title: string
  status: string
  submitted_at: string
  feedback_at?: string
}

export function SubmissionsList() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('admin_submissions_view')
      .select('id, student_name, exercise_title, lesson_title, module_title, status, submitted_at, feedback_at')
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        setSubmissions(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter)

  const pendingCount = submissions.filter(s => s.status === 'submitted').length

  return (
    <div className="submissions-list">
      {/* Header */}
      <div className="list-header">
        <div className="list-title-row">
          <h2 className="list-title">Entregas</h2>
          {pendingCount > 0 && (
            <span className="pending-badge">{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Filters */}
        <div className="filter-tabs">
          {(['all', 'pending', 'reviewed'] as const).map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f === 'pending' ? 'submitted' as any : f)}
              type="button"
            >
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Corregidas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="list-loading">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No hay entregas {filter !== 'all' ? 'en esta categoría' : 'todavía'}.</p>
        </div>
      ) : (
        <div className="submissions-table">
          {filtered.map(sub => (
            <button
              key={sub.id}
              className={`submission-row ${sub.status}`}
              onClick={() => router.push(`/admin/submissions/${sub.id}`)}
              type="button"
            >
              <div className="row-left">
                <div className="row-avatar">
                  {sub.student_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="row-info">
                  <span className="row-student">{sub.student_name}</span>
                  <span className="row-exercise">{sub.exercise_title}</span>
                  <span className="row-lesson">{sub.module_title} · {sub.lesson_title}</span>
                </div>
              </div>
              <div className="row-right">
                <div className={`row-status ${sub.status}`}>
                  {sub.status === 'reviewed' ? '✦ Corregido' : '⟳ Pendiente'}
                </div>
                <span className="row-date">
                  {new Date(sub.submitted_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short',
                  })}
                </span>
                <span className="row-arrow">→</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .submissions-list {
          background: rgba(42,31,16,0.4);
          border: 1px solid rgba(196,151,90,0.2);
          border-radius: 10px; overflow: hidden;
        }
        .list-header {
          padding: 24px 24px 0;
          border-bottom: 1px solid rgba(196,151,90,0.15);
        }
        .list-title-row {
          display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
        }
        .list-title {
          margin: 0; font-size: 13px; letter-spacing: 3px;
          text-transform: uppercase; color: rgba(196,151,90,0.7);
          font-family: 'Lato', sans-serif; font-weight: 400;
        }
        .pending-badge {
          background: rgba(232,139,106,0.2); color: #E88B6A;
          border: 1px solid rgba(232,139,106,0.3);
          font-size: 11px; padding: 3px 10px; border-radius: 20px;
          font-family: 'Lato', sans-serif;
        }
        .filter-tabs { display: flex; gap: 0; }
        .filter-tab {
          padding: 10px 18px; background: none; border: none;
          color: rgba(196,151,90,0.4); cursor: pointer;
          font-size: 13px; font-family: 'Lato', sans-serif;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: all 0.15s;
        }
        .filter-tab:hover { color: rgba(196,151,90,0.8); }
        .filter-tab.active {
          color: #C4975A; border-bottom-color: #C4975A;
        }
        .list-loading { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .skeleton-row {
          height: 72px; background: rgba(196,151,90,0.05); border-radius: 6px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .empty-state {
          padding: 48px; text-align: center;
          color: rgba(253,246,236,0.25); font-size: 15px;
          font-family: 'Lato', sans-serif;
        }
        .submissions-table { display: flex; flex-direction: column; }
        .submission-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 18px 24px;
          border: none; background: transparent;
          border-bottom: 1px solid rgba(196,151,90,0.08);
          cursor: pointer; text-align: left;
          transition: background 0.15s; width: 100%;
        }
        .submission-row:last-child { border-bottom: none; }
        .submission-row:hover { background: rgba(196,151,90,0.06); }
        .submission-row.submitted { border-left: 3px solid #C4975A; }
        .submission-row.reviewed { border-left: 3px solid rgba(196,151,90,0.2); }
        .row-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
        .row-avatar {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #C4975A, #8A6030);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: #1A1208;
        }
        .row-info {
          display: flex; flex-direction: column; gap: 3px; min-width: 0;
        }
        .row-student {
          font-size: 15px; color: #FDF6EC; font-family: 'Lato', sans-serif;
          font-weight: 600;
        }
        .row-exercise {
          font-size: 14px; color: rgba(253,246,236,0.65);
          font-family: 'Lato', sans-serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .row-lesson {
          font-size: 12px; color: rgba(253,246,236,0.3);
          font-family: 'Lato', sans-serif;
        }
        .row-right {
          display: flex; align-items: center; gap: 12px; flex-shrink: 0;
        }
        .row-status {
          font-size: 11px; letter-spacing: 1px; padding: 4px 10px;
          border-radius: 20px;
        }
        .row-status.submitted {
          background: rgba(196,151,90,0.15); color: #C4975A;
          border: 1px solid rgba(196,151,90,0.3);
        }
        .row-status.reviewed {
          background: rgba(100,120,80,0.1); color: rgba(139,175,112,0.6);
          border: 1px solid rgba(100,120,80,0.2);
        }
        .row-date {
          font-size: 12px; color: rgba(253,246,236,0.3);
          font-family: 'Lato', sans-serif;
        }
        .row-arrow { font-size: 16px; color: rgba(196,151,90,0.35); }
      `}</style>
    </div>
  )
}
