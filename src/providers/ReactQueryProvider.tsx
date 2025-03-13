'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function ReactQueryProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Create a new QueryClient instance for each client
  // This ensures that data is not shared between users and requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // You can set default options here
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
} 