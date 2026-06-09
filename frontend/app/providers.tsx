'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry:               1,      // retry once before surfacing an error
        staleTime:           30_000, // cache for 30 s
        refetchOnWindowFocus: false,  // don't refetch when tab regains focus
        throwOnError:         false,  // never throw on query refetch errors
      },
      // No global mutation onError — each mutation hook has its own specific error handler.
      // A global handler here fires IN ADDITION TO individual handlers, causing duplicate toasts.
    },
  })
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}

        {/* Toaster — outside page content, inside providers */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background:   '#1a1d28',
              color:        '#f0f0f5',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize:     '13px',
              fontWeight:   '500',
              padding:      '10px 14px',
              boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#1a1d28' },
              style: { borderColor: 'rgba(52,211,153,0.25)' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#1a1d28' },
              style: { borderColor: 'rgba(248,113,113,0.25)' },
              duration: 6000, // errors stay visible longer
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}