import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalUsers, totalEntries, pendingEntries, approvedEntries, rejectedEntries] = await Promise.all([
      prisma.user.count(),
      prisma.entry.count(),
      prisma.entry.count({ where: { status: 'PENDING' } }),
      prisma.entry.count({ where: { status: 'APPROVED' } }),
      prisma.entry.count({ where: { status: 'REJECTED' } })
    ])

    const stats = {
      totalUsers,
      totalEntries,
      pendingEntries,
      approvedEntries,
      rejectedEntries,
      systemHealth: 'Good'
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}