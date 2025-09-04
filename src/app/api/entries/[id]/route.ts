import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Await the params Promise
    const { id } = await params

    const entry = await prisma.entry.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'TEAM_LEADER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await the params Promise
    const { id } = await params

    const entry = await prisma.entry.findUnique({
      where: { id }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Check permissions
    if (entry.submittedById !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Team leaders can only edit pending entries
    if (entry.status !== 'PENDING') {
      return NextResponse.json({ error: 'Can only edit pending entries' }, { status: 400 })
    }

    const data = await request.json()
    
    const updatedEntry = await prisma.entry.update({
      where: { id },
      data: {
        date: new Date(data.date),
        line: data.line,
        shift: data.shift,
        hour: data.hour, // NEW: Hour field
        teamLeader: data.teamLeader,
        shiftInCharge: data.shiftInCharge,
        model: data.model,
        operatorNames: data.operatorNames,
        stationNames: data.stationNames || [], // NEW: Station names
        availableTime: data.availableTime,
        lineCapacity: data.lineCapacity,
        
        // Updated production type
        productionType: data.productionType.toUpperCase(),
        
        // Handle target fields
        ppcTarget: data.ppcTarget,
        ppcTargetLH: data.ppcTargetLH,
        ppcTargetRH: data.ppcTargetRH,
        
        // Handle production fields
        goodParts: data.goodParts,
        goodPartsLH: data.goodPartsLH,
        goodPartsRH: data.goodPartsRH,
        
        // Handle SPD fields
        spdParts: data.spdParts,
        spdPartsLH: data.spdPartsLH,
        spdPartsRH: data.spdPartsRH,
        
        // Handle rejection fields
        rejects: data.rejects,
        rejectsLH: data.rejectsLH,
        rejectsRH: data.rejectsRH,
        
        // Loss Time section (formerly Problem Head)
        problemHead: data.problemHead,
        description: data.description, // Now text input
        lossTime: data.lossTime,
        responsibility: data.responsibility,
        defectType: data.defectType.toUpperCase(),
        newDefectDescription: data.newDefectDescription || null,
        newDefectCorrectiveAction: data.newDefectCorrectiveAction || null, // NEW
        
        // Multiple rejection details stored as JSON
        rejectionDetails: data.rejectionDetails || [], // NEW: Array of rejection objects
        
        // 4M Change Management fields
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
        
        updatedAt: new Date()
      },
      include: {
        submittedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Await the params Promise
    const { id } = await params

    const entry = await prisma.entry.findUnique({
      where: { id }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Only allow deletion by entry owner (team leader) or supervisors/admins
    if (user.role === 'TEAM_LEADER' && entry.submittedById !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Team leaders can only delete pending entries
    if (user.role === 'TEAM_LEADER' && entry.status !== 'PENDING') {
      return NextResponse.json({ error: 'Can only delete pending entries' }, { status: 400 })
    }

    await prisma.entry.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Entry deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    )
  }
}