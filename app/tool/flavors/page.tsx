import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FlavorsPage() {
  const db = createAdminClient()
  const { data: flavors, error } = await db
    .from('humor_flavors')
    .select('id, slug, description, created_datetime_utc')
    .order('created_datetime_utc', { ascending: false })

  if (error) throw error

  // Get step counts per flavor
  const { data: steps } = await db
    .from('humor_flavor_steps')
    .select('humor_flavor_id')

  const stepCounts: Record<number, number> = {}
  steps?.forEach(s => {
    stepCounts[s.humor_flavor_id] = (stepCounts[s.humor_flavor_id] ?? 0) + 1
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Humor Flavors</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {flavors?.length ?? 0} flavor{flavors?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/tool/flavors/new" className="btn-primary">+ New Flavor</Link>
      </div>

      {/* Definition callout */}
      <div className="mb-8 p-4 rounded-xl text-sm"
           style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
        <p className="font-semibold mb-1" style={{ color: 'var(--accent)' }}>What is a humor flavor?</p>
        <p style={{ color: 'var(--text-muted)' }}>
          A humor flavor is a set of steps that run in a specific order to create captions from an input image.
          For example, a flavor might first describe the image in text, then find something funny about it,
          then output five short, funny captions. Each flavor has its own name (slug), description, and ordered list of pipeline steps.
        </p>
      </div>

      {!flavors?.length ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">⛓️</div>
          <p className="text-white font-medium mb-1">No flavors yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Create your first humor flavor to get started</p>
          <Link href="/tool/flavors/new" className="btn-primary">+ New Flavor</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {flavors.map(f => {
            const count = stepCounts[f.id] ?? 0
            return (
              <div key={f.id} className="card" style={{ position: 'relative' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Pipeline icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                      <span style={{ color: 'var(--accent)', fontSize: '18px' }}>⛓</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white font-mono">{f.slug}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                          {count} step{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {f.description ?? 'No description'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                        Created {new Date(f.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/tool/flavors/${f.id}/steps`}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      Steps
                    </Link>
                    <Link href={`/tool/flavors/${f.id}/test`}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                      Test
                    </Link>
                    <Link href={`/tool/flavors/${f.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                          style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
