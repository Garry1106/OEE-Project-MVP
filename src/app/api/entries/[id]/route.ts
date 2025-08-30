import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.entry.findUnique({
      where: { id: params.id },
      include: {
        submittedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } }
      }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Team leaders can only access their own entries
    if (user.role === 'TEAM_LEADER' && entry.submittedById !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch entry' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.entry.findUnique({
      where: { id: params.id }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Check permissions
    if (user.role === 'TEAM_LEADER' && entry.submittedById !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Team leaders can only edit pending entries
    if (user.role === 'TEAM_LEADER' && entry.status !== 'PENDING') {
      return NextResponse.json({ error: 'Can only edit pending entries' }, { status: 400 })
    }

    const data = await request.json()
    
    const updatedEntry = await prisma.entry.update({
      where: { id: params.id },
      data: {
        date: new Date(data.date),
        line: data.line,
        shift: data.shift,
        teamLeader: data.teamLeader,
        shiftInCharge: data.shiftInCharge,
        model: data.model,
        operatorNames: data.operatorNames,
        availableTime: data.availableTime,
        lineCapacity: data.lineCapacity,
        ppcTarget: data.ppcTarget,
        goodParts: data.goodParts,
        rejects: data.rejects,
        problemHead: data.problemHead,
        description: data.description,
        lossTime: data.lossTime,
        responsibility: data.responsibility,
        productionType: data.productionType,
        defectType: data.defectType,
        newDefectDescription: data.newDefectDescription || null,
        rejectionPhenomena: data.rejectionPhenomena || null,
        rejectionCause: data.rejectionCause || null,
        rejectionCorrectiveAction: data.rejectionCorrectiveAction || null,
        rejectionCount: data.rejectionCount || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error('Entry update error:', error)
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    )
  }
}