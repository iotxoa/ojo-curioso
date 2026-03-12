'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, Eye, Type, LogOut, Menu, X } from 'lucide-react'

export default function Nav({ role }: { role: 'student' | 'admin' }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [contrast, setContrast] = useState(false)
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl'>('md')
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('ojo-theme') as 'dark' | 'light' | null
    const savedContrast = localStorage.getItem('ojo-contrast') === 'true'
    const savedFont = localStorage.getItem('ojo-fontsize') as 'md' | 'lg' | 'xl' | null
    if (saved) applyTheme(saved)
    if (savedContrast) applyContrast(true)
    if (savedFont) applyFontSize(savedFont)
  }, [])

  function applyTheme(t: 'dark' | 'light') {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('ojo-theme', t)
  }

  function applyContrast(v: boolean) {
    setContrast(v)
    document.documentElement.setAttribute('data-contrast', v ? 'high' : 'normal')
    localStorage.setItem('ojo-contrast', String(v))
  }

  function applyFontSize(s: 'md' | 'lg' | 'xl') {
    setFontSize(s)
    document.documentElement.setAttribute('data-fontsize', s)
    localStorage.setItem('ojo-fontsize', s)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const studentLinks = [
    { href: '/student/dashboard', label: 'Inicio' },
    { href: '/student/ejercicios', label: 'Ejercicios' },
  ]

  const adminLinks = [
    { href: '/admin', label: 'Panel admin' },
    { href: '/student/dashboard', label: 'Vista alumno' },
  ]

  const links = role === 'admin' ? adminLinks : studentLinks

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--bg-base)',
      borderBottom: '0.5px solid var(--border)',
      padding: '0 1.5rem',
    }}>
      <div style={{
        maxWidth: '900px', margin: '0 auto',
        height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/student/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.1rem',
            color: 'var(--text-primary)',
          }}>
            el <em style={{ color: 'var(--accent)' }}>ojo</em> curioso
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{
              textDecoration: 'none',
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              color: pathname === l.href ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color 0.2s',
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Theme toggle */}
          <button
            onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '6px',
              borderRadius: '6px', transition: 'color 0.2s',
              display: 'flex', alignItems: 'center',
            }}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark'
              ? <Sun size={16} />
              : <Moon size={16} />}
          </button>

          {/* Accessibility */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '6px',
                borderRadius: '6px', display: 'flex', alignItems: 'center',
              }}
              title="Accesibilidad"
            >
              <Type size={16} />
            </button>

            {settingsOpen && (
              <div className="card" style={{
                position: 'absolute', right: 0, top: '110%',
                width: '220px', padding: '1rem', zIndex: 100,
              }}>
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Accesibilidad
                </p>

                {/* Tamaño de texto */}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Tamaño del texto</p>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {(['md', 'lg', 'xl'] as const).map(s => (
                    <button key={s}
                      onClick={() => applyFontSize(s)}
                      style={{
                        flex: 1, padding: '4px', borderRadius: '4px', cursor: 'pointer',
                        fontSize: s === 'md' ? '0.75rem' : s === 'lg' ? '0.85rem' : '0.95rem',
                        background: fontSize === s ? 'var(--accent-dim)' : 'var(--bg-surface)',
                        border: `0.5px solid ${fontSize === s ? 'var(--accent)' : 'var(--border)'}`,
                        color: fontSize === s ? 'var(--accent)' : 'var(--text-muted)',
                      }}>
                      {s === 'md' ? 'A' : s === 'lg' ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>

                {/* Alto contraste */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Eye size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Alto contraste</span>
                  </div>
                  <button
                    onClick={() => applyContrast(!contrast)}
                    style={{
                      width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                      background: contrast ? 'var(--accent)' : 'var(--border)',
                      border: 'none', position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '2px',
                      left: contrast ? '18px' : '2px',
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: 'white', transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '6px',
              borderRadius: '6px', display: 'flex', alignItems: 'center',
            }}
            title="Salir"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )
}
