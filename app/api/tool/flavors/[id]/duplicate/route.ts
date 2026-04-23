import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const { slug } = body
  if (!slug?.trim()) return NextResponse.json({ error: 'Slug is required' }, { status: 400 })

  const db = createAdminClient()

  // Fetch original flavor's steps
  const { data: steps, error: stepsError } = await db
    .from('humor_flavor_steps')
    .select('order_by, description, llm_temperature, llm_system_prompt, llm_user_prompt, llm_model_id, humor_flavor_step_type_id, llm_input_type_id, llm_output_type_id')
    .eq('humor_flavor_id', id)
    .order('order_by', { ascending: true })
  if (stepsError) return NextResponse.json({ error: stepsError.message }, { status: 500 })

  // Create the new flavor
  const { data: newFlavor, error: flavorError } = await db
    .from('humor_flavors')
    .insert({ slug: slug.trim(), description: null, created_by_user_id: user.id })
    .select()
    .single()
  if (flavorError) return NextResponse.json({ error: flavorError.message }, { status: 500 })

  // Copy steps to new flavor
  if (steps && steps.length > 0) {
    const newSteps = steps.map(s => ({ ...s, humor_flavor_id: newFlavor.id, created_by_user_id: user.id }))
    const { error: insertError } = await db.from('humor_flavor_steps').insert(newSteps)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(newFlavor, { status: 201 })
}