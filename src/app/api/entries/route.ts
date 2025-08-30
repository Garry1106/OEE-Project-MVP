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

    // Check if entry already exists for this date/shift/line/hour
    // Check if entry already exists for this date/shift/line/hour
    // Check if entry already exists for this date/shift/line/hour
    const existingEntry = await prisma.entry.findFirst({
      where: {
        date: new Date(data.date),
        shift: data.shift,
        line: data.line,
        hour: data.hour
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Entry already exists for this date, shift, line, and hour' },
        { status: 400 }
      )
    }

    const entry = await prisma.entry.create({
      data: {
        date: new Date(data.date),
        line: data.line,
        shift: data.shift,
        hour: data.hour, // NEW FIELD
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
        productionType: data.productionType.toUpperCase(), // Ensure uppercase
        defectType: data.defectType.toUpperCase(), // Ensure uppercase
        newDefectDescription: data.newDefectDescription || null,
        rejectionPhenomena: data.rejectionPhenomena || null,
        rejectionCause: data.rejectionCause || null,
        rejectionCorrectiveAction: data.rejectionCorrectiveAction || null,
        rejectionCount: data.rejectionCount || null,
        submittedById: user.id,
        status: 'PENDING',
        has4MChange: data.has4MChange || false,
        manChange: data.manChange || null,
        manReason: data.manReason || null,
        manCC: data.manCC || null,
        manSC: data.manSC || null,
        manGeneral: data.manGeneral || null,
        machineChange: data.machineChange || null,
        machineReason: data.machineReason || null,
        machineCC: data.machineCC || null,
        machineSC: data.machineSC || null,
        machineGeneral: data.machineGeneral || null,
        materialChange: data.materialChange || null,
        materialReason: data.materialReason || null,
        materialCC: data.materialCC || null,
        materialSC: data.materialSC || null,
        materialGeneral: data.materialGeneral || null,
        methodChange: data.methodChange || null,
        methodReason: data.methodReason || null,
        methodCC: data.methodCC || null,
        methodSC: data.methodSC || null,
        methodGeneral: data.methodGeneral || null,
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