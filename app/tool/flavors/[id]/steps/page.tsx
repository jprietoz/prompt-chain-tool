'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface Step {
  id: number; order_by: number; description: string | null
  llm_temperature: number | null; humor_flavor_id: number
  llm_model_id: number | null; humor_flavor_step_type_id: number | null
  llm_system_prompt: string | null; llm_user_prompt: string | null
  llm_models: { name: string } | { name: string }[] | null
  humor_flavor_step_types: { slug: string } | { slug: string }[] | null
}

function getName(v: { name: string } | { name: string }[] | null) {
  if (!v) return null
  return Array.isArray(v) ? (v[0]?.name ?? null) : v.name
}
function getSlug(v: { slug: string } | { slug: string }[] | null) {
  if (!v) return null
  return Array.isArray(v) ? (v[0]?.slug ?? null) : v.slug
}

export default function FlavorStepsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [steps, setSteps] = useState<Step[]>([])
  const [flavorSlug, setFlavorSlug] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/tool/flavors/${id}/steps`).then(r => r.json()),
      fetch(`/api/tool/flavors/${id}`).then(r => r.json()),
    ]).then(([stepsData, flavorData]) => {
      setSteps(stepsData)
      setFlavorSlug(flavorData.slug ?? '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const moveStep = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= steps.length) return
    setReordering(true); setError(null)
    try {
      const a = steps[index], b = steps[targetIndex]
      const res = await fetch('/api/tool/steps/reorder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: [{ id: a.id, order_by: b.order_by }, { id: b.id, order_by: a.order_by }] }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed')
    } finally { setReordering(false) }
  }

  if (loading) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <Link href="/tool/flavors" style={{ color: 'var(--accent)' }}>Flavors</Link>
        <span>/</span>
        <Link href={`/tool/flavors/${id}`} style={{ color: 'var(--accent)' }}>{flavorSlug}</Link>
        <span>/</span>
        <span className="text-white">Steps</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline Steps</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {steps.length} step{steps.length !== 1 ? 's' : ''} in <span style={{ color: 'var(--accent)' }} className="font-mono">{flavorSlug}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/tool/flavors/${id}/test`}
                className="text-sm px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
            Test
          </Link>
          <Link href={`/tool/flavors/${id}/steps/new`} className="btn-primary text-sm">+ Add Step</Link>
        </div>
      </div>

      {/* Definition callout */}
      <div className="mb-8 p-4 rounded-xl text-sm"
           style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
        <p className="font-semibold mb-1" style={{ color: 'var(--accent)' }}>What is a pipeline step?</p>
        <p style={{ color: 'var(--text-muted)' }}>
          Each step is one LLM call in the chain. Steps run in order — the output of an earlier step can feed into the
          next step&apos;s prompt. A step defines which model to use, the system prompt, the user prompt, and the temperature.
          Use the ▲ ▼ arrows to reorder steps.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
          {error}
        </div>
      )}

      {!steps.length ? (
        <div className="card text-center py-12">
          <p className="text-white font-medium mb-1">No steps yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Add your first pipeline step</p>
          <Link href={`/tool/flavors/${id}/steps/new`} className="btn-primary">+ Add Step</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={s.id} className="step-node">
              {/* Step badge */}
              <div className="step-badge">{s.order_by}</div>

              {/* Step card */}
              <div className="card flex-1" style={{ marginBottom: 0 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getSlug(s.humor_flavor_step_types) && (
                        <span className="text-xs px-2 py-0.5 rounded font-mono"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                          {getSlug(s.humor_flavor_step_types)}
                        </span>
                      )}
                      {getName(s.llm_models) && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{getName(s.llm_models)}</span>
                      )}
                      {s.llm_temperature != null && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>temp: {s.llm_temperature}</span>
                      )}
                    </div>
                    {s.description && (
                      <p className="text-sm text-white mb-2">{s.description}</p>
                    )}
                    {s.llm_system_prompt && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>SYSTEM</p>
                        <p className="text-xs font-mono line-clamp-2 p-2 rounded"
                           style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {s.llm_system_prompt}
                        </p>
                      </div>
                    )}
                    {s.llm_user_prompt && (
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>USER</p>
                        <p className="text-xs font-mono line-clamp-2 p-2 rounded"
                           style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {s.llm_user_prompt}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveStep(i, -1)} disabled={reordering || i === 0}
                        className="w-7 h-7 flex items-center justify-center rounded text-xs disabled:opacity-20 transition-colors"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                        ▲
                      </button>
                      <button onClick={() => moveStep(i, 1)} disabled={reordering || i === steps.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded text-xs disabled:opacity-20 transition-colors"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                        ▼
                      </button>
                    </div>
                    <Link href={`/tool/steps/${s.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                      Edit
                    </Link>
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
