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
        goodPartsLH: true,
        goodPartsRH: true,
        spdParts: true,
        spdPartsLH: true,
        spdPartsRH: true,
        rejects: true,
        rejectsLH: true,
        rejectsRH: true,
        ppcTarget: true,
        ppcTargetLH: true,
        ppcTargetRH: true,
        lossTime: true
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
        goodPartsLH: true,
        goodPartsRH: true,
        spdParts: true,
        spdPartsLH: true,
        spdPartsRH: true,
        rejects: true,
        rejectsLH: true,
        rejectsRH: true,
        lossTime: true
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
        goodPartsLH: true,
        goodPartsRH: true,
        spdParts: true,
        spdPartsLH: true,
        spdPartsRH: true,
        rejects: true,
        rejectsLH: true,
        rejectsRH: true
      }
    })

    // Get production type analytics
    const productionTypeAnalytics = await prisma.entry.groupBy({
      by: ['productionType'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'APPROVED',
        productionType: { not: null }
      },
      _count: { id: true },
      _sum: {
        goodParts: true,
        goodPartsLH: true,
        goodPartsRH: true,
        spdParts: true,
        spdPartsLH: true,
        spdPartsRH: true,
        rejects: true,
        rejectsLH: true,
        rejectsRH: true
      }
    })

    // Get defect type analytics
    const defectTypeAnalytics = await prisma.entry.groupBy({
      by: ['defectType'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'APPROVED',
        defectType: { not: null }
      },
      _count: { id: true }
    })

    // Get daily production trend (last 7 days) with enhanced data
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
        goodPartsLH: true,
        goodPartsRH: true,
        spdParts: true,
        spdPartsLH: true,
        spdPartsRH: true,
        rejects: true,
        rejectsLH: true,
        rejectsRH: true,
        productionType: true
      }
    })

    // Helper function to calculate totals based on production type
    const calculateTotals = (entry: any) => {
      if (entry.productionType === 'BOTH') {
        return {
          totalGood: (entry.goodPartsLH || 0) + (entry.goodPartsRH || 0),
          totalSpd: (entry.spdPartsLH || 0) + (entry.spdPartsRH || 0),
          totalRejects: (entry.rejectsLH || 0) + (entry.rejectsRH || 0)
        }
      } else {
        return {
          totalGood: entry.goodParts || 0,
          totalSpd: entry.spdParts || 0,
          totalRejects: entry.rejects || 0
        }
      }
    }

    // Process daily data with enhanced calculations
    const dailyStats = dailyProduction.reduce((acc, entry) => {
      const dateKey = entry.date.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = { goodParts: 0, spdParts: 0, rejects: 0 }
      }
      const totals = calculateTotals(entry)
      acc[dateKey].goodParts += totals.totalGood
      acc[dateKey].spdParts += totals.totalSpd
      acc[dateKey].rejects += totals.totalRejects
      return acc
    }, {} as Record<string, { goodParts: number; spdParts: number; rejects: number }>)

    // Enhanced line performance calculation
    const enhancedLinePerformance = entriesByLine.map(item => {
      const totalGood = (item._sum.goodParts || 0) + (item._sum.goodPartsLH || 0) + (item._sum.goodPartsRH || 0)
      const totalSpd = (item._sum.spdParts || 0) + (item._sum.spdPartsLH || 0) + (item._sum.spdPartsRH || 0)
      const totalRejects = (item._sum.rejects || 0) + (item._sum.rejectsLH || 0) + (item._sum.rejectsRH || 0)
      const totalProduction = totalGood + totalSpd + totalRejects
      const totalTarget = (item._sum.ppcTarget || 0) + (item._sum.ppcTargetLH || 0) + (item._sum.ppcTargetRH || 0)

      return {
        line: item.line,
        totalEntries: item._count.id,
        totalGoodParts: totalGood,
        totalSpdParts: totalSpd,
        totalRejects: totalRejects,
        totalProduction: totalProduction,
        totalTarget: totalTarget,
        efficiency: totalProduction > 0 ? Math.round(((totalGood + totalSpd) / totalProduction) * 100) : 0,
        rejectRate: totalProduction > 0 ? Math.round((totalRejects / totalProduction) * 100) : 0,
        targetAchievement: totalTarget > 0 ? Math.round((totalProduction / totalTarget) * 100) : 0,
        avgLossTime: item._count.id > 0 ? Math.round((item._sum.lossTime || 0) / item._count.id) : 0
      }
    })

    // Enhanced shift analytics
    const enhancedShiftAnalytics = entriesByShift.map(item => {
      const totalGood = (item._sum.goodParts || 0) + (item._sum.goodPartsLH || 0) + (item._sum.goodPartsRH || 0)
      const totalSpd = (item._sum.spdParts || 0) + (item._sum.spdPartsLH || 0) + (item._sum.spdPartsRH || 0)
      const totalRejects = (item._sum.rejects || 0) + (item._sum.rejectsLH || 0) + (item._sum.rejectsRH || 0)
      const totalProduction = totalGood + totalSpd + totalRejects

      return {
        shift: item.shift,
        totalProduction: totalProduction,
        totalGood: totalGood,
        totalSpd: totalSpd,
        totalRejects: totalRejects,
        efficiency: totalProduction > 0 ? Math.round(((totalGood + totalSpd) / totalProduction) * 100) : 0,
        rejectRate: totalProduction > 0 ? Math.round((totalRejects / totalProduction) * 100) : 0,
        entries: item._count.id,
        avgLossTime: item._count.id > 0 ? Math.round((item._sum.lossTime || 0) / item._count.id) : 0
      }
    })

    // Enhanced model performance
    const enhancedModelPerformance = entriesByModel.map(item => {
      const totalGood = (item._sum.goodParts || 0) + (item._sum.goodPartsLH || 0) + (item._sum.goodPartsRH || 0)
      const totalSpd = (item._sum.spdParts || 0) + (item._sum.spdPartsLH || 0) + (item._sum.spdPartsRH || 0)
      const totalRejects = (item._sum.rejects || 0) + (item._sum.rejectsLH || 0) + (item._sum.rejectsRH || 0)
      const totalProduction = totalGood + totalSpd + totalRejects

      return {
        model: item.model,
        totalProduction: totalProduction,
        totalGood: totalGood,
        totalSpd: totalSpd,
        totalRejects: totalRejects,
        efficiency: totalProduction > 0 ? Math.round(((totalGood + totalSpd) / totalProduction) * 100) : 0,
        averageRejects: Math.round(totalRejects / item._count.id),
        entries: item._count.id
      }
    })

    // Enhanced production type analytics
    const enhancedProductionTypeAnalytics = productionTypeAnalytics.map(item => {
      const totalGood = (item._sum.goodParts || 0) + (item._sum.goodPartsLH || 0) + (item._sum.goodPartsRH || 0)
      const totalSpd = (item._sum.spdParts || 0) + (item._sum.spdPartsLH || 0) + (item._sum.spdPartsRH || 0)
      const totalRejects = (item._sum.rejects || 0) + (item._sum.rejectsLH || 0) + (item._sum.rejectsRH || 0)
      const totalProduction = totalGood + totalSpd + totalRejects

      return {
        productionType: item.productionType,
        entries: item._count.id,
        totalProduction: totalProduction,
        totalGood: totalGood,
        totalSpd: totalSpd,
        totalRejects: totalRejects,
        efficiency: totalProduction > 0 ? Math.round(((totalGood + totalSpd) / totalProduction) * 100) : 0,
        rejectRate: totalProduction > 0 ? Math.round((totalRejects / totalProduction) * 100) : 0
      }
    })

    const analytics = {
      summary: {
        totalEntries,
        pendingEntries,
        approvedEntries,
        rejectedEntries,
        approvalRate: totalEntries > 0 ? Math.round((approvedEntries / totalEntries) * 100) : 0
      },
      linePerformance: enhancedLinePerformance,
      shiftAnalytics: enhancedShiftAnalytics,
      modelPerformance: enhancedModelPerformance,
      productionTypeAnalytics: enhancedProductionTypeAnalytics,
      defectTypeAnalytics: defectTypeAnalytics.map(item => ({
        defectType: item.defectType,
        count: item._count.id,
        percentage: totalEntries > 0 ? Math.round((item._count.id / totalEntries) * 100) : 0
      })),
      dailyTrend: Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        goodParts: stats.goodParts,
        spdParts: stats.spdParts,
        rejects: stats.rejects,
        total: stats.goodParts + stats.spdParts + stats.rejects,
        efficiency: (stats.goodParts + stats.spdParts + stats.rejects) > 0 ? 
          Math.round(((stats.goodParts + stats.spdParts) / (stats.goodParts + stats.spdParts + stats.rejects)) * 100) : 0
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