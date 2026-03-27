import { redirect } from 'next/navigation'
import { createClient } from '@/lib/auth-client-server'
import { createAdminClient } from '@/lib/supabase-admin'
import TopNav from './TopNav'

export default async function ToolLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient()
  const { data: { user }, error } = await authClient.auth.getUser()
  if (!user || error) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_superadmin, is_matrix_admin, first_name, last_name, email')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_superadmin || profile?.is_matrix_admin
  if (!isAdmin) redirect('/unauthorized')

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
    : (profile?.email ?? user.email ?? 'User')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <TopNav displayName={displayName} userEmail={user.email ?? ''} />
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
