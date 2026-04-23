'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DuplicateFlavorButton({ id, slug }: { id: number; slug: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setNewSlug(`copy-of-${slug}`)
    setError(null)
    setOpen(true)
  }

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSlug.trim()) { setError('Slug is required'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/tool/flavors/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to duplicate')
      router.push(`/tool/flavors/${json.id}/steps`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        Duplicate
      </button>
    )
  }

  return (
    <form onSubmit={handleDuplicate} className="flex items-center gap-2">
      <input
        autoFocus
        className="input-field text-xs px-2 py-1.5 h-auto"
        style={{ minWidth: 0, width: '160px' }}
        value={newSlug}
        onChange={e => setNewSlug(e.target.value)}
        placeholder="new-slug"
        disabled={loading}
      />
      {error && <span className="text-xs" style={{ color: '#ef4444' }}>{error}</span>}
      <button
        type="submit"
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
        style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
      >
        {loading ? '…' : 'Save'}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs px-3 py-1.5 rounded-lg font-medium"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        Cancel
      </button>
    </form>
  )
}