import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { queryClient } from './lib/queryClient'
import { theme, darkTheme } from './lib/theme'
import { useAppStore } from './store/useAppStore'
import App from './App'
import './index.css' // ← import Tailwind
import { logger } from './lib/logger'
import { ErrorBoundary } from './components/ErrorBoundary'

function ThemedApp() {
  const { themeMode } = useAppStore()
  const activeTheme = themeMode === 'dark' ? darkTheme : theme
  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

// App init log and global error handlers (only register once)
try {
  logger.info('App init', {
    mode: import.meta.env.MODE,
    apiBase: (import.meta as any)?.env?.VITE_API_BASE_URL,
    logLevel: (import.meta as any)?.env?.VITE_LOG_LEVEL,
  })
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
      logger.error('Global error', {
        message: e.message,
        filename: (e as any).filename,
        lineno: (e as any).lineno,
        colno: (e as any).colno,
        error: (e as any).error?.stack || String((e as any).error),
      })
    })
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      const reason: any = (e as any).reason
      logger.error('Unhandled promise rejection', {
        reason: typeof reason === 'object' ? reason?.message || String(reason) : String(reason),
        stack: reason?.stack,
      })
    })
  }
} catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemedApp />
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
)