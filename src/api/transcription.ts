import { customFetcher } from './http'
import { logger } from '../lib/logger'

export type AudioProcessingQueued = {
  processing_task_id: string
  status: string
  message?: string
}

export type AudioProcessingStatus = {
  task_id: string
  status: 'analyzing' | 'converting' | 'completed' | 'error'
  converted_file?: string
  error?: string
}

export type TranscriptionQueued = {
  transcription_task_id: string
  status: string
  processing_task_id: string
}

export type TranscriptionStatus = {
  task_id: string
  status: 'processing' | 'completed' | 'error'
  result?: {
    text?: string
    segments?: {
      start?: number
      end?: number
      text?: string
      speaker?: string
    }[]
  }
  error?: string
}

export type GenerateNotesResponse = {
  task_id: string
  notes_result?: { status: 'completed' | 'error'; notes?: string; error?: string }
}

export async function uploadAudio(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  logger.info('Upload start', { name: file.name, size: file.size, type: file.type })
  const res = await customFetcher<AudioProcessingQueued>('/api/v1/upload-audio', {
    method: 'POST',
    body: fd,
  })
  logger.info('Upload queued', res)
  return res
}

export function getAudioProcessingStatus(taskId: string) {
  return customFetcher<AudioProcessingStatus>(`/api/v1/audio-processing/${taskId}`, {
    method: 'GET',
  })
}

export function startTranscription(processingTaskId: string) {
  logger.info('Transcription start', { processingTaskId })
  const url = `/api/v1/transcribe/${processingTaskId}?use_diarization=true`
  return customFetcher<TranscriptionQueued>(url, {
    method: 'POST',
  })
}

export function getTranscription(taskId: string) {
  return customFetcher<TranscriptionStatus>(`/api/v1/transcribe/${taskId}`, {
    method: 'GET',
  })
}

export function generateNotes(taskId: string) {
  logger.info('Generate notes', { transcriptionTaskId: taskId })
  return customFetcher<GenerateNotesResponse>(`/api/v1/generate-notes/${taskId}`, {
    method: 'POST',
  })
}

export async function poll<T>(fn: () => Promise<T>, isDone: (v: T) => boolean, opts?: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal }) {
  const intervalMs = opts?.intervalMs ?? 1200
  const timeoutMs = opts?.timeoutMs ?? 5 * 60 * 1000
  const start = Date.now()
  while (true) {
    if (opts?.signal?.aborted) throw new Error('Aborted')
    const v = await fn()
    if (isDone(v)) return v
    if (Date.now() - start > timeoutMs) throw new Error('Polling timed out')
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}
