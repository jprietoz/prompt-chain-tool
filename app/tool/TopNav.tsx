'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/auth-client-browser'

type Theme = 'dark' | 'light' | 'system'

const THEME_CYCLE: Theme[] = ['dark', 'light', 'system']
const THEME_ICON: Record<Theme, string> = { dark: '🌙', light: '☀️', system: '💻' }
const THEME_LABEL: Record<Theme, string> = { dark: 'Dark', light: 'Light', system: 'System' }

const NAV_ITEMS = [
  { href: '/tool/flavors', label: 'Flavors' },
  { href: '/tool/captions', label: 'Captions' },
]

function applyTheme(t: Theme) {
  if (t === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', t)
  }
}

export default function TopNav({ displayName, userEmail }: { displayName: string; userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('dark')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pct-theme') as Theme | null
      const initial: Theme = stored === 'light' ? 'light' : stored === 'system' ? 'system' : 'dark'
      setTheme(initial)
      applyTheme(initial)
    } catch {}
  }, [])

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]
    setTheme(next)
    applyTheme(next)
    try { localStorage.setItem('pct-theme', next) } catch {}
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
               style={{ background: 'var(--accent)', color: '#0a0f1e' }}>⛓</div>
          <span className="font-bold text-sm text-white">Prompt Chain Tool</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                }}>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            title={`Theme: ${THEME_LABEL[theme]} — click to cycle`}>
            <span>{THEME_ICON[theme]}</span>
            <span>{THEME_LABEL[theme]}</span>
          </button>

          <div className="relative">
            <button onClick={() => setMenuOpen(p => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                   style={{ background: 'var(--accent)', color: '#0a0f1e' }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate">{displayName}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-xl z-50 overflow-hidden"
                   style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{userEmail}</p>
                </div>
                <button onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-sm transition-colors"
                  style={{ color: 'var(--danger)' }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
