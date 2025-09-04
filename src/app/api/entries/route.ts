import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  console.log('🚀 GET request initiated')
  
  try {
    const token = request.cookies.get('token')?.value
    console.log('🔑 Token extracted:', token ? 'Token exists' : 'No token found')
    
    if (!token) {
      console.log('❌ Authorization failed: No token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    console.log('👤 User lookup result:', user ? `User found: ${user.email} (${user.role})` : 'User not found')
    
    if (!user) {
      console.log('❌ Authorization failed: Invalid token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    console.log('🔍 Query parameters - status:', status || 'No status filter')

    let where: any = {}

    if (user.role === 'TEAM_LEADER') {
      where.submittedById = user.id
      console.log('👑 Team leader access: Filtering by submittedById =', user.id)
    } else {
      console.log('🌐 Admin/other role access: No submittedById filter')
    }

    if (status) {
      where.status = status
      console.log('📊 Adding status filter:', status)
    }

    console.log('🔍 Final where clause:', JSON.stringify(where, null, 2))

    const entries = await prisma.entry.findMany({
      where,
      include: {
        submittedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('📋 Entries retrieved:', entries.length, 'records found')
    console.log('📝 Entry IDs:', entries.map(entry => entry.id))

    return NextResponse.json(entries)
  } catch (error) {
    console.error('💥 Error in GET /entries:', error)
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
        hour: data.hour,
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
        
        submittedById: user.id,
        status: 'PENDING',
        
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