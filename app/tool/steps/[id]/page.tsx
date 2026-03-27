'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface StepData {
  id: number; humor_flavor_id: number; order_by: number; description: string | null
  llm_temperature: number | null; llm_system_prompt: string | null; llm_user_prompt: string | null
  llm_model_id: number | null; humor_flavor_step_type_id: number | null; created_datetime_utc: string
}

export default function EditStepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [step, setStep] = useState<StepData | null>(null)
  const [form, setForm] = useState({
    humor_flavor_id: '', order_by: '1', description: '', llm_temperature: '',
    llm_system_prompt: '', llm_user_prompt: '', llm_model_id: '', humor_flavor_step_type_id: '',
  })
  const [flavors, setFlavors] = useState<{ id: number; slug: string }[]>([])
  const [models, setModels] = useState<{ id: number; name: string }[]>([])
  const [stepTypes, setStepTypes] = useState<{ id: number; slug: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/tool/steps/${id}`).then(r => r.json()),
      fetch('/api/tool/flavors').then(r => r.json()),
      fetch('/api/tool/models').then(r => r.json()),
      fetch('/api/tool/step-types').then(r => r.json()),
    ]).then(([stepData, f, m, t]: [StepData, typeof flavors, typeof models, typeof stepTypes]) => {
      setStep(stepData)
      setFlavors(f)
      setModels(m)
      setStepTypes(t)
      setForm({
        humor_flavor_id: String(stepData.humor_flavor_id ?? ''),
        order_by: String(stepData.order_by ?? 1),
        description: stepData.description ?? '',
        llm_temperature: stepData.llm_temperature != null ? String(stepData.llm_temperature) : '',
        llm_system_prompt: stepData.llm_system_prompt ?? '',
        llm_user_prompt: stepData.llm_user_prompt ?? '',
        llm_model_id: stepData.llm_model_id != null ? String(stepData.llm_model_id) : '',
        humor_flavor_step_type_id: stepData.humor_flavor_step_type_id != null ? String(stepData.humor_flavor_step_type_id) : '',
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.humor_flavor_id) { setError('Flavor is required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/tool/steps/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
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
      if (!res.ok) throw new Error(json.error ?? 'Failed to update')
      setSuccess('Saved'); setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this step? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tool/steps/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      const flavorId = step?.humor_flavor_id
      router.push(flavorId ? `/tool/flavors/${flavorId}/steps` : '/tool/flavors')
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); setDeleting(false) }
  }

  if (loading) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>

  const flavorSlug = flavors.find(f => f.id === step?.humor_flavor_id)?.slug ?? ''

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <Link href="/tool/flavors" style={{ color: 'var(--accent)' }}>Flavors</Link>
        <span>/</span>
        {step && <Link href={`/tool/flavors/${step.humor_flavor_id}/steps`} style={{ color: 'var(--accent)' }}>{flavorSlug}</Link>}
        <span>/</span>
        <span className="text-white">Edit Step</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Step</h1>
      {step && <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>ID: {step.id} · Created: {new Date(step.created_datetime_utc).toLocaleDateString()}</p>}
      <div className="card">
        <form onSubmit={handleSave} className="space-y-5">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>{error}</div>}
          {success && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>{success}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Flavor <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select className="input-field" value={form.humor_flavor_id}
                onChange={e => setForm(p => ({ ...p, humor_flavor_id: e.target.value }))} required>
                <option value="">— Select flavor —</option>
                {flavors.map(f => <option key={f.id} value={f.id}>{f.slug}</option>)}
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
              <label className="block text-sm font-medium text-white mb-1.5">Step Type</label>
              <select className="input-field" value={form.humor_flavor_step_type_id}
                onChange={e => setForm(p => ({ ...p, humor_flavor_step_type_id: e.target.value }))}>
                <option value="">— None —</option>
                {stepTypes.map(t => <option key={t.id} value={t.id}>{t.slug}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">LLM Model</label>
              <select className="input-field" value={form.llm_model_id}
                onChange={e => setForm(p => ({ ...p, llm_model_id: e.target.value }))}>
                <option value="">— None —</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Temperature</label>
            <input className="input-field" type="number" step="0.1" min="0" max="2" value={form.llm_temperature}
              onChange={e => setForm(p => ({ ...p, llm_temperature: e.target.value }))} placeholder="e.g. 0.7"
              style={{ width: '8rem' }} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Description</label>
            <input className="input-field" type="text" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">System Prompt</label>
            <textarea className="input-field resize-y font-mono" value={form.llm_system_prompt}
              onChange={e => setForm(p => ({ ...p, llm_system_prompt: e.target.value }))} rows={6} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">User Prompt</label>
            <textarea className="input-field resize-y font-mono" value={form.llm_user_prompt}
              onChange={e => setForm(p => ({ ...p, llm_user_prompt: e.target.value }))} rows={6} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href={step ? `/tool/flavors/${step.humor_flavor_id}/steps` : '/tool/flavors'} className="btn-ghost px-4 py-2 text-sm">
                Cancel
              </Link>
            </div>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {deleting ? 'Deleting…' : 'Delete Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
