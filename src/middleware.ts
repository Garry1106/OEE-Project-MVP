import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

interface JWTPayload {
  userId: string
  email: string
  role: string
}

async function verifyTokenEdge(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  console.log('Middleware - Path:', pathname, 'Token exists:', !!token)

  // Public routes that don't require authentication
  if (pathname === '/login' || pathname === '/') {
    if (token) {
      try {
        const payload = await verifyTokenEdge(token)
        console.log('Redirecting authenticated user to dashboard:', payload)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch (error) {
        console.log('Invalid token, staying on public route')
        // Invalid token, continue to public route
      }
    }
    return NextResponse.next()
  }

  // Protected routes
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/api/entries') ||
      pathname.startsWith('/api/parameters') ||
      pathname.startsWith('/api/analytics')) {
    
    if (!token) {
      console.log('No token found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const payload = await verifyTokenEdge(token)
      console.log('Token verified:', payload)
      
      // Role-based route protection
      if (pathname.startsWith('/dashboard/analytics') && payload.role !== 'SUPERVISOR') {
        console.log('Unauthorized access to analytics, redirecting')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('user-id', payload.userId)
      requestHeaders.set('user-role', payload.role)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.log('Token verification failed:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}