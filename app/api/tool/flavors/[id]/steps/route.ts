import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = createAdminClient()
  const { data, error } = await db
    .from('humor_flavor_steps')
    .select(`id, order_by, description, llm_temperature, llm_system_prompt, llm_user_prompt,
             created_datetime_utc, humor_flavor_id, llm_model_id, humor_flavor_step_type_id, llm_input_type_id,
             llm_models(name), humor_flavor_step_types(slug), llm_input_types(slug)`)
    .eq('humor_flavor_id', id)
    .order('order_by', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
