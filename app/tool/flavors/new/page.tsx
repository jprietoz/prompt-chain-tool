'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewFlavorPage() {
  const router = useRouter()
  const [form, setForm] = useState({ slug: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.slug.trim()) { setError('Slug is required'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/tool/flavors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: form.slug, description: form.description || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create')
      router.push('/tool/flavors')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <Link href="/tool/flavors" style={{ color: 'var(--accent)' }}>Flavors</Link>
        <span>/</span>
        <span className="text-white">New Flavor</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">Create Humor Flavor</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Slug <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input className="input-field" type="text" value={form.slug}
              onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
              placeholder="e.g. gen-z-sarcasm" required />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Lowercase, hyphen-separated identifier</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Description</label>
            <textarea className="input-field resize-none" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What tone or style does this humor flavor represent?" rows={4} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Flavor'}
            </button>
            <Link href="/tool/flavors" className="btn-ghost px-4 py-2 text-sm">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
