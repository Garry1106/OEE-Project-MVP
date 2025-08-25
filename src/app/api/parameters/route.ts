import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type) {
      const parameter = await prisma.parameter.findUnique({
        where: { type: type as any }
      })
      return NextResponse.json(parameter?.values || [])
    }

    const parameters = await prisma.parameter.findMany()
    const parameterMap = parameters.reduce((acc:any, param:any) => {
      acc[param.type] = param.values
      return acc
    }, {} as Record<string, string[]>)

    return NextResponse.json(parameterMap)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch parameters' },
      { status: 500 }
    )
  }
}