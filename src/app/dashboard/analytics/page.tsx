import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserFromToken } from '@/lib/auth'
import Analytics from '@/components/Analytics'

export default async function AnalyticsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'SUPERVISOR') {
    redirect('/dashboard')
  }

  return <Analytics />
}