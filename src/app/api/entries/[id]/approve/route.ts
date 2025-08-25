import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()
    
    // Await the params Promise
    const { id } = await params
    
    const entry = await prisma.entry.update({
      where: { id },
      data: {
        status: status as 'APPROVED' | 'REJECTED',
        approvedById: user.id,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    )
  }
}