import { customFetcher } from './http'
import { logger } from '../lib/logger'

export type RecordingGlobalStatus = {
  state: 'idle' | 'recording'
  recording_task_id?: string | null
  elapsed_seconds?: number | null
}

export type RecordingPreflightResponse = {
  has_blackhole: boolean
  has_multi_output_device: boolean
  default_output_is_multi_output: boolean
  microphone_access_granted: boolean
  recommendations?: string[]
}

export type RecordingStartRequest = {
  separate_tracks?: boolean
  create_mixed?: boolean
  sample_rate?: number
  format?: 'wav'
}

export type RecordingStartResponse = {
  recording_task_id: string
  status: 'recording'
  started_at: string
  config?: RecordingStartRequest
}

export type RecordingStopRequest = {
  recording_task_id: string
  auto_handoff?: boolean
  handoff_artifact?: 'mixed' | 'system' | 'mic'
}

export type RecordingArtifact = {
  path: string
  duration_seconds?: number | null
  sample_rate?: number | null
  channels?: number | null
  size_bytes?: number | null
}

export type RecordingStopResponse = {
  recording_task_id: string
  status: 'completed' | 'error'
  completed_at?: string
  artifacts?: {
    mic?: RecordingArtifact | null
    system?: RecordingArtifact | null
    mixed?: RecordingArtifact | null
  }
  auto_handoff_result?: {
    started?: boolean
    processing_task_id?: string | null
    message?: string | null
  } | null
  warnings?: string[]
  error?: string | null
}

export type RecordingDetail = {
  recording_task_id: string
  status: 'preflight' | 'recording' | 'finalizing' | 'completed' | 'error'
  started_at?: string | null
  completed_at?: string | null
  artifacts?: {
    mic?: RecordingArtifact | null
    system?: RecordingArtifact | null
    mixed?: RecordingArtifact | null
  }
  durations?: {
    mic_sec?: number | null
    system_sec?: number | null
    mixed_sec?: number | null
  }
  warnings?: string[]
  error?: string | null
}

export function getRecordingStatus() {
  return customFetcher<RecordingGlobalStatus>('/api/v1/recordings/status', { method: 'GET' })
}

export function recordingPreflight() {
  return customFetcher<RecordingPreflightResponse>('/api/v1/recordings/preflight', { method: 'POST' })
}

export function startRecording(body?: RecordingStartRequest) {
  logger.info('Recording start', body)
  return customFetcher<RecordingStartResponse>('/api/v1/recordings/start', {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function stopRecording(body: RecordingStopRequest) {
  logger.info('Recording stop', body)
  return customFetcher<RecordingStopResponse>('/api/v1/recordings/stop', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getRecordingDetail(recordingTaskId: string) {
  return customFetcher<RecordingDetail>(`/api/v1/recordings/${recordingTaskId}`, { method: 'GET' })
}

