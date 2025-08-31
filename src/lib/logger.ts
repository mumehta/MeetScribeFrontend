type Level = 'debug' | 'info' | 'warn' | 'error' | 'silent'

function getLevel(): Level {
  // Read from Vite env or window override, default info in dev, warn in prod
  const env = (globalThis as any)?.import?.meta?.env?.VITE_LOG_LEVEL
    || (typeof process !== 'undefined' && (process as any)?.env?.VITE_LOG_LEVEL)
    || (typeof window !== 'undefined' && (window as any)?.VITE_LOG_LEVEL)
  const val = (env || (import.meta?.env?.MODE === 'production' ? 'warn' : 'info')) as Level
  const allowed: Level[] = ['debug', 'info', 'warn', 'error', 'silent']
  return allowed.includes(val) ? val : 'info'
}

const levelOrder: Record<Exclude<Level, 'silent'>, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

let currentLevel = getLevel()

// Remote logging config (frontend -> backend)
const ENABLE_REMOTE = (() => {
  const v = (globalThis as any)?.import?.meta?.env?.VITE_ENABLE_SERVER_LOGS
    || (typeof process !== 'undefined' && (process as any)?.env?.VITE_ENABLE_SERVER_LOGS)
    || (typeof window !== 'undefined' && (window as any)?.VITE_ENABLE_SERVER_LOGS)
  return String(v).toLowerCase() === 'true'
})()

const LOG_ENDPOINT =
  (globalThis as any)?.import?.meta?.env?.VITE_LOG_ENDPOINT
  || (typeof process !== 'undefined' && (process as any)?.env?.VITE_LOG_ENDPOINT)
  || (typeof window !== 'undefined' && (window as any)?.VITE_LOG_ENDPOINT)
  || '/api/v1/logs'

const BATCH_MS = Number(
  (globalThis as any)?.import?.meta?.env?.VITE_LOG_BATCH_MS
  || (typeof process !== 'undefined' && (process as any)?.env?.VITE_LOG_BATCH_MS)
  || (typeof window !== 'undefined' && (window as any)?.VITE_LOG_BATCH_MS)
  || 4000,
)

type LogRecord = { ts: string; level: Exclude<Level, 'silent'>; msg: string; data?: any }
const queue: LogRecord[] = []
let flushTimer: number | undefined

function enqueue(rec: LogRecord) {
  if (!ENABLE_REMOTE) return
  queue.push(rec)
  if (!flushTimer) {
    // @ts-ignore
    flushTimer = setTimeout(flush, BATCH_MS)
  }
  if (queue.length >= 25) flush()
}

async function flush() {
  if (!queue.length) return
  // @ts-ignore
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = undefined
  const batch = queue.splice(0, queue.length)
  try {
    const payload = JSON.stringify({ source: 'meetscribe-frontend', logs: batch })
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([payload], { type: 'application/json' })
      // @ts-ignore
      navigator.sendBeacon(LOG_ENDPOINT, blob)
      return
    }
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
  } catch {
    // Swallow to avoid impacting UX
  }
}

export function setLogLevel(l: Level) {
  currentLevel = l
}

function shouldLog(l: Exclude<Level, 'silent'>) {
  if (currentLevel === 'silent') return false
  return levelOrder[l] >= levelOrder[(currentLevel as Exclude<Level, 'silent'>) || 'info']
}

function prefix() {
  const ts = new Date().toISOString()
  return `[MeetScribe][${ts}]`
}

function emit(level: Exclude<Level, 'silent'>, args: any[]) {
  if (!shouldLog(level)) return
  const ts = new Date().toISOString()
  const [msg, ...rest] = args
  const msgStr = typeof msg === 'string' ? msg : JSON.stringify(msg)
  const rec: LogRecord = { ts, level, msg: msgStr, data: rest?.length ? rest : undefined }
  // Console sink
  const p = prefix()
  // eslint-disable-next-line no-console
  ;(console as any)[level]?.(p, ...args)
  // Remote sink
  enqueue(rec)
}

export const logger = {
  debug: (...args: any[]) => emit('debug', args),
  info: (...args: any[]) => emit('info', args),
  warn: (...args: any[]) => emit('warn', args),
  error: (...args: any[]) => emit('error', args),
}
