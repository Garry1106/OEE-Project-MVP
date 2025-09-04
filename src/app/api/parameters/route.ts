import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Received GET request:', request.url)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    console.log('Query parameter "type":', type)

    if (type) {
      const parameter = await prisma.parameter.findUnique({
        where: { type: type as any }
      })
      console.log('Fetched parameter for type:', type, parameter)
      return NextResponse.json(parameter?.values || [])
    }

    const parameters = await prisma.parameter.findMany()
    console.log('Fetched all parameters:', parameters)
    const parameterMap = parameters.reduce((acc: any, param: any) => {
      acc[param.type] = param.values
      return acc
    }, {} as Record<string, string[]>)
    console.log('Parameter map:', parameterMap)

    return NextResponse.json(parameterMap)
  } catch (error) {
    console.error('Error fetching parameters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parameters' },
      { status: 500 }
    )
  }
}