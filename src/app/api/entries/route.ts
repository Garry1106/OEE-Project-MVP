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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let where: any = {}
    
    if (user.role === 'TEAM_LEADER') {
      where.submittedById = user.id
    }
    
    if (status) {
      where.status = status
    }

    const entries = await prisma.entry.findMany({
      where,
      include: {
        submittedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(entries)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'TEAM_LEADER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const entry = await prisma.entry.create({
      data: {
        date: new Date(data.date),
        line: data.line,
        shift: data.shift,
        teamLeader: data.teamLeader,
        shiftInCharge: data.shiftInCharge,
        model: data.model,
        numOfOperators: data.numOfOperators,
        availableTime: data.availableTime,
        lineCapacity: data.lineCapacity,
        ppcTarget: data.ppcTarget,
        goodParts: data.goodParts,
        rejects: data.rejects,
        problemHead: data.problemHead,
        description: data.description,
        lossTime: data.lossTime,
        responsibility: data.responsibility,
        rejectionPhenomena: data.rejectionPhenomena || null,
        rejectionCause: data.rejectionCause || null,
        rejectionCorrectiveAction: data.rejectionCorrectiveAction || null,
        rejectionCount: data.rejectionCount || null,
        submittedById: user.id,
        status: 'PENDING'
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Entry creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    )
  }
}