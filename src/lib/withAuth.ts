import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Higher-order function to protect routes
export function withAuth<T extends Record<string, string>>(
    handler: (
      request: Request,
      context: { params: T }
    ) => Promise<Response>
  ) {
    return async function(
      request: Request,
      context: { params: T }
    ): Promise<Response> {
    try {
      // Check if user is authenticated
      const { userId } = await auth()
      
      // Reject if not authenticated
      if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 })
      }
      
      // Get the user object
      const user = await currentUser()
      
      // Get whitelist from environment variable
      const whitelist = process.env.WHITELISTED_EMAILS?.split(',') || []
      
      // Check if user's email is in the whitelist
      const userEmail = user?.emailAddresses?.[0]?.emailAddress
      
      if (!userEmail || !whitelist.includes(userEmail)) {
        return new NextResponse('Forbidden: User not in whitelist', { status: 403 })
      }
      
      // User is authenticated and in whitelist, proceed with the handler
      return handler(request, context)
    } catch (error) {
      console.error('Authentication error:', error)
      return new NextResponse('Internal Server Error', { status: 500 })
    }
  }
}