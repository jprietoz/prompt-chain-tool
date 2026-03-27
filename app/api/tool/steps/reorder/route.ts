import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

interface StepReorderItem {
  id: number
  order_by: number
}

export async function POST(req: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { steps } = body as { steps: StepReorderItem[] }

  if (!Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: 'steps array is required' }, { status: 400 })
  }

  const db = createAdminClient()

  // Update each step's order_by
  const updates = await Promise.all(
    steps.map(({ id, order_by }) =>
      db
        .from('humor_flavor_steps')
        .update({ order_by })
        .eq('id', id)
        .select('id, order_by')
        .single()
    )
  )

  const errors = updates.filter(u => u.error)
  if (errors.length > 0) {
    return NextResponse.json(
      { error: errors[0].error?.message ?? 'Reorder failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, updated: updates.map(u => u.data) })
}
