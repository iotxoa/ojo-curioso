'use client'
// components/lesson/FileUploader.tsx
import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UploadedFile {
  name: string
  url: string
  path: string
  type: string
  size: number
}

interface FileUploaderProps {
  userId: string
  exerciseId: string
  existingFiles?: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
}

const MAX_SIZE_MB = 50
const ACCEPTED = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx'

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  return '📝'
}

export function FileUploader({ userId, exerciseId, existingFiles = [], onFilesChange }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrors(prev => [...prev, `${file.name} supera los ${MAX_SIZE_MB}MB`])
      return null
    }

    const ext = file.name.split('.').pop()
    const path = `${userId}/${exerciseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('submissions')
      .upload(path, file, { upsert: false })

    if (error) {
      setErrors(prev => [...prev, `Error subiendo ${file.name}: ${error.message}`])
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('submissions')
      .getPublicUrl(path)

    return { name: file.name, url: publicUrl, path, type: file.type, size: file.size }
  }

  const handleFiles = useCallback(async (fileList: FileList) => {
    setErrors([])
    setUploading(true)
    const newFiles: UploadedFile[] = []

    for (const file of Array.from(fileList)) {
      const uploaded = await uploadFile(file)
      if (uploaded) newFiles.push(uploaded)
    }

    const updated = [...files, ...newFiles]
    setFiles(updated)
    onFilesChange(updated)
    setUploading(false)
  }, [files, onFilesChange])

  const removeFile = async (path: string) => {
    await supabase.storage.from('submissions').remove([path])
    const updated = files.filter(f => f.path !== path)
    setFiles(updated)
    onFilesChange(updated)
  }

  return (
    <div className="file-uploader">
      {/* Drop zone */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          style={{ display: 'none' }}
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="upload-state">
            <span className="spinner">⟳</span>
            <span>Subiendo...</span>
          </div>
        ) : (
          <div className="upload-state">
            <span className="upload-icon">↑</span>
            <span className="upload-label">Arrastra archivos aquí o haz clic</span>
            <span className="upload-hint">Fotos, PDF, Word · Máx. {MAX_SIZE_MB}MB por archivo</span>
          </div>
        )}
      </div>

      {/* Errores */}
      {errors.map((err, i) => (
        <p key={i} className="upload-error">⚠ {err}</p>
      ))}

      {/* Archivos subidos */}
      {files.length > 0 && (
        <div className="files-list">
          {files.map(f => (
            <div key={f.path} className="file-item">
              <span className="file-icon">{fileIcon(f.type)}</span>
              <div className="file-info">
                <span className="file-name">{f.name}</span>
                <span className="file-size">{formatSize(f.size)}</span>
              </div>
              {f.type.startsWith('image/') && (
                <img src={f.url} alt={f.name} className="file-thumb" />
              )}
              <button
                type="button"
                className="file-remove"
                onClick={() => removeFile(f.path)}
                title="Eliminar"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .file-uploader { display: flex; flex-direction: column; gap: 12px; }
        .drop-zone {
          border: 2px dashed rgba(196, 151, 90, 0.35);
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(26, 18, 8, 0.5);
        }
        .drop-zone:hover, .drop-zone.drag-over {
          border-color: #C4975A;
          background: rgba(196, 151, 90, 0.08);
        }
        .drop-zone.uploading { opacity: 0.6; pointer-events: none; }
        .upload-state {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .upload-icon {
          font-size: 28px; color: #C4975A; font-weight: 300;
          display: inline-block; width: 48px; height: 48px;
          border: 1px solid rgba(196,151,90,0.3); border-radius: 50%;
          line-height: 46px; text-align: center;
        }
        .spinner { font-size: 28px; color: #C4975A; animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .upload-label { font-size: 15px; color: #FDF6EC; font-family: 'Lato', sans-serif; }
        .upload-hint { font-size: 12px; color: rgba(253,246,236,0.4); font-family: 'Lato', sans-serif; }
        .upload-error { color: #E88B6A; font-size: 13px; margin: 0; font-family: 'Lato', sans-serif; }
        .files-list { display: flex; flex-direction: column; gap: 8px; }
        .file-item {
          display: flex; align-items: center; gap: 12px;
          background: rgba(42, 31, 16, 0.6);
          border: 1px solid rgba(196, 151, 90, 0.2);
          border-radius: 6px; padding: 10px 14px;
        }
        .file-icon { font-size: 20px; flex-shrink: 0; }
        .file-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .file-name {
          font-size: 14px; color: #FDF6EC; font-family: 'Lato', sans-serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .file-size { font-size: 11px; color: rgba(253,246,236,0.4); font-family: 'Lato', sans-serif; }
        .file-thumb {
          width: 44px; height: 44px; object-fit: cover; border-radius: 4px;
          border: 1px solid rgba(196,151,90,0.3); flex-shrink: 0;
        }
        .file-remove {
          width: 28px; height: 28px; border: none; background: rgba(196,151,90,0.1);
          color: #C4975A; border-radius: 4px; cursor: pointer; font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; flex-shrink: 0;
        }
        .file-remove:hover { background: rgba(232, 139, 106, 0.2); color: #E88B6A; }
      `}</style>
    </div>
  )
}
