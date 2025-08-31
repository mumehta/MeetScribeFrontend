import { useQuery } from '@tanstack/react-query'
import { logger } from '../lib/logger'

const API_BASE = import.meta.env.VITE_API_BASE_URL as string

export function useHello() {
  return useQuery({
    queryKey: ['hello'],
    queryFn: async () => {
      try {
        logger.debug('Health check request', { url: `${API_BASE}/` })
        const res = await fetch(`${API_BASE}/`)
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          logger.warn('Health check failed', { status: res.status, body: txt })
          throw new Error('Failed to fetch')
        }
        const json = (await res.json()) as { status: string; service: string; version: string }
        logger.info('Health check ok', json)
        return json
      } catch (e: any) {
        logger.error('Health check error', { error: e?.message || String(e) })
        throw e
      }
    },
  })
}