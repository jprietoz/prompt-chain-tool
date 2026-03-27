'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FlavorData { id: number; slug: string; description: string | null; created_datetime_utc: string }

export default function EditFlavorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [flavor, setFlavor] = useState<FlavorData | null>(null)
  const [form, setForm] = useState({ slug: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/tool/flavors/${id}`).then(r => r.json()).then((data: FlavorData) => {
      setFlavor(data)
      setForm({ slug: data.slug ?? '', description: data.description ?? '' })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.slug.trim()) { setError('Slug is required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/tool/flavors/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: form.slug, description: form.description || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update')
      setSuccess('Saved'); setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete flavor "${flavor?.slug}"? This will also delete all steps.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tool/flavors/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      router.push('/tool/flavors')
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); setDeleting(false) }
  }

  if (loading) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <Link href="/tool/flavors" style={{ color: 'var(--accent)' }}>Flavors</Link>
        <span>/</span>
        <span className="text-white">Edit</span>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{flavor?.slug}</h1>
        <div className="flex gap-2">
          <Link href={`/tool/flavors/${id}/steps`} className="btn-ghost text-sm px-3 py-1.5">Steps</Link>
          <Link href={`/tool/flavors/${id}/test`}
                className="text-sm px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
            Test
          </Link>
        </div>
      </div>
      {flavor && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          ID: {flavor.id} · Created: {new Date(flavor.created_datetime_utc).toLocaleDateString()}
        </p>
      )}
      <div className="card">
        <form onSubmit={handleSave} className="space-y-5">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>{error}</div>}
          {success && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>{success}</div>}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Slug <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="input-field" type="text" value={form.slug}
              onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Description</label>
            <textarea className="input-field resize-none" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href="/tool/flavors" className="btn-ghost px-4 py-2 text-sm">Cancel</Link>
            </div>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {deleting ? 'Deleting…' : 'Delete Flavor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
