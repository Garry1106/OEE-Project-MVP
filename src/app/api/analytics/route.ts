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
    if (!user || (user.role !== 'SUPERVISOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get basic counts
    const [totalEntries, pendingEntries, approvedEntries, rejectedEntries] = await Promise.all([
      prisma.entry.count(),
      prisma.entry.count({ where: { status: 'PENDING' } }),
      prisma.entry.count({ where: { status: 'APPROVED' } }),
      prisma.entry.count({ where: { status: 'REJECTED' } })
    ])

    // Get entries by line (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const entriesByLine = await prisma.entry.groupBy({
      by: ['line'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'APPROVED'
      },
      _count: { id: true },
      _sum: {
        goodParts: true,
        rejects: true
      }
    })

    // Get entries by shift for shift analytics
    const entriesByShift = await prisma.entry.groupBy({
      by: ['shift'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'APPROVED'
      },
      _count: { id: true },
      _sum: {
        goodParts: true,
        rejects: true
      }
    })

    // Get entries by model
    const entriesByModel = await prisma.entry.groupBy({
      by: ['model'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'APPROVED'
      },
      _count: { id: true },
      _sum: {
        goodParts: true,
        rejects: true
      }
    })

    // Get daily production trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const dailyProduction = await prisma.entry.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: 'APPROVED'
      },
      select: {
        date: true,
        goodParts: true,
        rejects: true
      }
    })

    // Process daily data
    const dailyStats = dailyProduction.reduce((acc, entry) => {
      const dateKey = entry.date.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = { goodParts: 0, rejects: 0 }
      }
      acc[dateKey].goodParts += entry.goodParts
      acc[dateKey].rejects += entry.rejects
      return acc
    }, {} as Record<string, { goodParts: number; rejects: number }>)

    const analytics = {
      summary: {
        totalEntries,
        pendingEntries,
        approvedEntries,
        rejectedEntries,
        approvalRate: totalEntries > 0 ? Math.round((approvedEntries / totalEntries) * 100) : 0
      },
      linePerformance: entriesByLine.map(item => ({
        line: item.line,
        totalEntries: item._count.id,
        totalGoodParts: item._sum.goodParts || 0,
        totalRejects: item._sum.rejects || 0,
        rejectRate: item._sum.goodParts ? 
          Math.round(((item._sum.rejects || 0) / (item._sum.goodParts + (item._sum.rejects || 0))) * 100) : 0
      })),
      shiftAnalytics: entriesByShift.map(item => ({
        shift: item.shift,
        totalProduction: (item._sum.goodParts || 0) + (item._sum.rejects || 0),
        efficiency: item._sum.goodParts ? 
          Math.round((item._sum.goodParts / (item._sum.goodParts + (item._sum.rejects || 0))) * 100) : 0,
        entries: item._count.id
      })),
      modelPerformance: entriesByModel.map(item => ({
        model: item.model,
        totalProduction: (item._sum.goodParts || 0) + (item._sum.rejects || 0),
        averageRejects: Math.round((item._sum.rejects || 0) / item._count.id),
        entries: item._count.id
      })),
      dailyTrend: Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        goodParts: stats.goodParts,
        rejects: stats.rejects,
        total: stats.goodParts + stats.rejects
      })).sort((a, b) => a.date.localeCompare(b.date))
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}