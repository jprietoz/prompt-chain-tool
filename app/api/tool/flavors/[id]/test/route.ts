import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

const EXTERNAL_API = 'https://api.almostcrackd.ai'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { image_url } = body

  if (!image_url) return NextResponse.json({ error: 'image_url is required' }, { status: 400 })

  const db = createAdminClient()

  // Get the flavor slug
  const { data: flavor, error: flavorError } = await db
    .from('humor_flavors')
    .select('id, slug')
    .eq('id', id)
    .single()

  if (flavorError || !flavor) {
    return NextResponse.json({ error: 'Flavor not found' }, { status: 404 })
  }

  // Create an image record first to get an imageId
  const { data: imageRecord, error: imageError } = await db
    .from('images')
    .insert({ url: image_url })
    .select('id')
    .single()

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 })
  }

  const imageId = imageRecord.id

  // Call external API to generate captions
  try {
    const apiRes = await fetch(`${EXTERNAL_API}/captions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_id: imageId,
        image_url,
        humor_flavor_slug: flavor.slug,
      }),
    })

    const result = await apiRes.json()

    if (!apiRes.ok) {
      return NextResponse.json({ error: result.error ?? result.message ?? 'External API error', imageId }, { status: 500 })
    }

    return NextResponse.json({ imageId, result })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to call external API',
      imageId,
    }, { status: 500 })
  }
}
