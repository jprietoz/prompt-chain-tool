'use client'
import { useState, useEffect } from 'react'

interface Caption {
  id: number; content: string; is_public: boolean; is_featured: boolean
  like_count: number; created_datetime_utc: string; humor_flavor_id: number | null
  humor_flavors: { slug: string } | { slug: string }[] | null
}

function getSlug(v: { slug: string } | { slug: string }[] | null) {
  if (!v) return null
  return Array.isArray(v) ? (v[0]?.slug ?? null) : v.slug
}

export default function CaptionsPage() {
  const [captions, setCaptions] = useState<Caption[]>([])
  const [flavors, setFlavors] = useState<{ id: number; slug: string }[]>([])
  const [filterFlavorId, setFilterFlavorId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/tool/captions').then(r => r.json()),
      fetch('/api/tool/flavors').then(r => r.json()),
    ]).then(([c, f]) => {
      setCaptions(Array.isArray(c) ? c : [])
      setFlavors(Array.isArray(f) ? f : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = filterFlavorId
    ? captions.filter(c => String(c.humor_flavor_id) === filterFlavorId)
    : captions

  if (loading) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Captions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} caption{filtered.length !== 1 ? 's' : ''}
            {filterFlavorId ? ' for selected flavor' : ' total'}
          </p>
        </div>
        <select value={filterFlavorId} onChange={e => setFilterFlavorId(e.target.value)}
          className="input-field" style={{ width: 'auto', minWidth: '160px' }}>
          <option value="">All flavors</option>
          {flavors.map(f => <option key={f.id} value={String(f.id)}>{f.slug}</option>)}
        </select>
      </div>

      {!filtered.length ? (
        <div className="card text-center py-12">
          <p className="text-white font-medium">No captions found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Generate captions by testing a flavor</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-relaxed">{c.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {getSlug(c.humor_flavors) && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                        {getSlug(c.humor_flavors)}
                      </span>
                    )}
                    {c.is_featured && (
                      <span className="text-xs px-2 py-0.5 rounded"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                        featured
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {c.like_count ?? 0} likes · {new Date(c.created_datetime_utc).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
