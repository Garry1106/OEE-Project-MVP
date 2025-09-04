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

    // Await the params Promise
    const { id } = await params

    // Check if entry exists
    const existingEntry = await prisma.entry.findUnique({
      where: { id }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Check if entry is already processed
    if (existingEntry.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Entry has already been processed' },
        { status: 400 }
      )
    }

    const { status, rejectionReason } = await request.json()
    
    // Validate status
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      )
    }

    // Validate rejection reason if rejecting
    if (status === 'REJECTED' && (!rejectionReason || rejectionReason.trim() === '')) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting an entry' },
        { status: 400 }
      )
    }
    
    const updateData: any = {
      status: status as 'APPROVED' | 'REJECTED',
      approvedBy: {
        connect: { id: user.id }
      },
      updatedAt: new Date()
    }

    // For now, we'll skip the rejectionReason field since it doesn't exist in the schema
    // If you want to add it, you'll need to update the Prisma schema first
    // if (status === 'REJECTED' && rejectionReason) {
    //   updateData.rejectionReason = rejectionReason.trim()
    // }
    
    const entry = await prisma.entry.update({
      where: { id },
      data: updateData,
      include: {
        submittedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Entry approval error:', error)
    
    return NextResponse.json(
      { error: 'Failed to update entry status' },
      { status: 500 }
    )
  }
}