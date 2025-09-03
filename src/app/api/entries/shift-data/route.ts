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
    const date = searchParams.get('date')
    const shift = searchParams.get('shift')
    const line = searchParams.get('line')

    if (!date || !shift || !line) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Find the first entry for this date/shift/line to get the shift data
    const firstEntry = await prisma.entry.findFirst({
      where: {
        date: new Date(date),
        shift: shift,
        line: line
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (firstEntry) {
      return NextResponse.json({
        date: firstEntry.date.toISOString().split('T')[0],
        line: firstEntry.line,
        operatorNames: firstEntry.operatorNames
      })
    }

    return NextResponse.json(null)
  } catch (error) {
    console.error('Failed to fetch shift data:', error)
    return NextResponse.json({ error: 'Failed to fetch shift data' }, { status: 500 })
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

    // This endpoint is just for saving shift data context
    // The actual data is stored with the entry
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save shift data:', error)
    return NextResponse.json({ error: 'Failed to save shift data' }, { status: 500 })
  }
}