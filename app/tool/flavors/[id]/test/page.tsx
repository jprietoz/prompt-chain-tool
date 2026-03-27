'use client'
import { useState, use } from 'react'
import Link from 'next/link'

export default function TestFlavorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imageId: string; result: unknown } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`/api/tool/flavors/${id}/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Test failed')
      setResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally { setLoading(false) }
  }

  const captions: string[] = (() => {
    if (!result) return []
    const r = result.result as Record<string, unknown>
    if (Array.isArray(r)) return r.map(c => typeof c === 'string' ? c : (c as Record<string, unknown>)?.content as string ?? JSON.stringify(c))
    if (Array.isArray(r?.captions)) return (r.captions as unknown[]).map(c => typeof c === 'string' ? c : (c as Record<string, unknown>)?.content as string ?? JSON.stringify(c))
    return []
  })()

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <Link href="/tool/flavors" style={{ color: 'var(--accent)' }}>Flavors</Link>
        <span>/</span>
        <Link href={`/tool/flavors/${id}`} style={{ color: 'var(--accent)' }}>Flavor {id}</Link>
        <span>/</span>
        <span className="text-white">Test</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Test Pipeline</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        Generate captions using the active flavor mix configuration.
        <Link href="/tool/flavors" className="ml-1" style={{ color: 'var(--accent)' }}>Make sure this flavor is active in Humor Mix.</Link>
      </p>

      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Input</h2>
        <form onSubmit={handleTest} className="space-y-4">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>{error}</div>}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Image URL <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>publicly accessible</span>
            </label>
            <input className="input-field" type="url" value={imageUrl}
              onChange={e => setImageUrl(e.target.value)} required placeholder="https://…" />
          </div>
          <button type="submit" disabled={loading || !imageUrl} className="btn-primary disabled:opacity-50">
            {loading ? 'Running pipeline…' : 'Generate Captions'}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Output</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              imageId: {result.imageId}
            </span>
          </div>

          {captions.length > 0 && (
            <div className="card space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Generated Captions</p>
              {captions.map((c, i) => (
                <div key={i} className="step-node">
                  <div className="step-badge">{i + 1}</div>
                  <div className="flex-1 p-3 rounded-lg text-sm text-white"
                       style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                    {c}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Raw Response</p>
            <pre className="text-xs font-mono overflow-auto max-h-80 p-3 rounded-lg"
                 style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
