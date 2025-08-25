import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserFromToken } from '@/lib/auth'
import Dashboard from '@/components/Dashboard'
import AdminDashboard from '@/components/AdminDashboard'

export default async function DashboardPage() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      redirect('/login')
    }

    const user:any = await getUserFromToken(token)
    
    if (!user) {
      redirect('/login')
    }

    // Route to appropriate dashboard based on role
    if (user.role === 'ADMIN') {
      return <AdminDashboard user={user} />
    } else {
      return <Dashboard user={user} />
    }
  } catch (error) {
    console.error('Dashboard page error:', error)
    redirect('/login')
  }
}