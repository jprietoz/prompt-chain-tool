'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewStepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState({
    humor_flavor_id: id,
    order_by: '1',
    description: '',
    llm_temperature: '',
    llm_system_prompt: '',
    llm_user_prompt: '',
    llm_model_id: '',
    humor_flavor_step_type_id: '',
  })
  const [models, setModels] = useState<{ id: number; name: string }[]>([])
  const [stepTypes, setStepTypes] = useState<{ id: number; slug: string }[]>([])
  const [flavorSlug, setFlavorSlug] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/tool/models').then(r => r.json()),
      fetch('/api/tool/step-types').then(r => r.json()),
      fetch(`/api/tool/flavors/${id}`).then(r => r.json()),
    ]).then(([m, t, f]) => {
      setModels(m)
      setStepTypes(t)
      setFlavorSlug(f.slug ?? '')
    }).catch(() => {})
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/tool/steps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humor_flavor_id: Number(form.humor_flavor_id),
          order_by: Number(form.order_by) || 1,
          description: form.description || null,
          llm_temperature: form.llm_temperature !== '' ? Number(form.llm_temperature) : null,
          llm_system_prompt: form.llm_system_prompt || null,
          llm_user_prompt: form.llm_user_prompt || null,
          llm_model_id: form.llm_model_id ? Number(form.llm_model_id) : null,
          humor_flavor_step_type_id: form.humor_flavor_step_type_id ? Number(form.humor_flavor_step_type_id) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create')
      router.push(`/tool/flavors/${id}/steps`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <Link href="/tool/flavors" style={{ color: 'var(--accent)' }}>Flavors</Link>
        <span>/</span>
        <Link href={`/tool/flavors/${id}/steps`} style={{ color: 'var(--accent)' }}>{flavorSlug}</Link>
        <span>/</span>
        <span className="text-white">New Step</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Add Pipeline Step</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Each step is one LLM call in the flavor&apos;s chain. Steps run in order — for example, step 1 might describe the image,
        step 2 finds something funny about the description, and step 3 outputs the final captions.
        Set the system prompt, user prompt, model, and temperature for this step.
      </p>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Step Type</label>
              <select className="input-field" value={form.humor_flavor_step_type_id}
                onChange={e => setForm(p => ({ ...p, humor_flavor_step_type_id: e.target.value }))}>
                <option value="">— None —</option>
                {stepTypes.map(t => <option key={t.id} value={t.id}>{t.slug}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Order</label>
              <input className="input-field" type="number" min="1" value={form.order_by}
                onChange={e => setForm(p => ({ ...p, order_by: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">LLM Model</label>
              <select className="input-field" value={form.llm_model_id}
                onChange={e => setForm(p => ({ ...p, llm_model_id: e.target.value }))}>
                <option value="">— None —</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Temperature</label>
              <input className="input-field" type="number" step="0.1" min="0" max="2"
                value={form.llm_temperature}
                onChange={e => setForm(p => ({ ...p, llm_temperature: e.target.value }))}
                placeholder="e.g. 0.7" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Description</label>
            <input className="input-field" type="text" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this step" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">System Prompt</label>
            <textarea className="input-field resize-y font-mono" value={form.llm_system_prompt}
              onChange={e => setForm(p => ({ ...p, llm_system_prompt: e.target.value }))}
              rows={5} placeholder="System prompt for this step…" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">User Prompt</label>
            <textarea className="input-field resize-y font-mono" value={form.llm_user_prompt}
              onChange={e => setForm(p => ({ ...p, llm_user_prompt: e.target.value }))}
              rows={5} placeholder="User prompt for this step…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Step'}
            </button>
            <Link href={`/tool/flavors/${id}/steps`} className="btn-ghost px-4 py-2 text-sm">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
