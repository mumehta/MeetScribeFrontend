import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, Snackbar } from '@mui/material'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { useAppStore } from '../store/useAppStore'
import { getRecordingDetail, startRecording, stopRecording } from '../api/recordings'
import {
  getAudioProcessingStatus,
  getTranscription,
  poll,
  registerServerLocalPath,
  startTranscription,
} from '../api/transcription'
import { logger } from '../lib/logger'
import { fetchBlob } from '../api/http'

function formatSeconds(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function RecordingControl() {
  const {
    recording,
    setRecording,
    recordingReady,
    postRecordingAction,
    recordingTaskId,
    setRecordingTaskId,
    stopping,
    setStopping,
    setProcessingTaskId,
    setTranscriptionTaskId,
    setTranscriptText,
    setNotesText,
    bumpResetUploadToken,
  } = useAppStore()
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyStage, setBusyStage] = useState<'idle' | 'finalizing' | 'processing' | 'transcribing'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({ open: false, message: '', severity: 'info' })
  // Preflight UI moved into PreflightCheck component; we now gate start by recordingReady
  const [stopOpen, setStopOpen] = useState(false)
  const [stopItems, setStopItems] = useState<string[]>([])

  function openSnack(message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') {
    setSnack({ open: true, message, severity })
  }
  function closeSnack() {
    setSnack((s) => ({ ...s, open: false }))
  }

  function downloadTextFile(name: string, text: string) {
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  }

  function formatHMS(seconds?: number | null) {
    if (!seconds || seconds <= 0) return '0:00'
    const total = Math.round(seconds)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function formatKHz(sr?: number | null) {
    if (!sr || sr <= 0) return undefined
    const khz = sr / 1000
    const val = Number.isInteger(khz) ? khz.toString() : (Math.round(khz * 10) / 10).toString()
    return `${val} kHz`
  }

  function summarizeArtifacts(artifacts: any | undefined | null) {
    if (!artifacts) return ''
    const parts: string[] = []
    const order: Array<['mixed' | 'system' | 'mic', any]> = [
      ['mixed', artifacts.mixed],
      ['system', artifacts.system],
      ['mic', artifacts.mic],
    ]
    for (const [name, a] of order) {
      if (!a) continue
      const dur = typeof a.duration_seconds === 'number' ? formatHMS(a.duration_seconds) : undefined
      const sr = typeof a.sample_rate === 'number' ? formatKHz(a.sample_rate) : undefined
      const piece = [name, dur, sr].filter(Boolean).join(' ')
      if (piece) parts.push(piece)
    }
    return parts.join(', ')
  }

  // Try to extract a useful artifact path from stop/detail responses
  function pickArtifactPath(artifacts: any | undefined | null): string | undefined {
    if (!artifacts) return undefined
    const candidates = [artifacts.mixed, artifacts.system, artifacts.mic].filter(Boolean)
    for (const a of candidates) {
      if (!a) continue
      // Known/expected keys
      if (typeof a.path === 'string' && a.path) return a.path
      // Defensive fallbacks in case backend uses different key
      if (typeof a.server_local_path === 'string' && a.server_local_path) return a.server_local_path
      if (typeof a.server_path === 'string' && a.server_path) return a.server_path
      if (typeof a.file === 'string' && a.file) return a.file
    }
    return undefined
  }

  // Start/stop simple counter when recording toggles
  useEffect(() => {
    if (recording) {
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
      setSeconds(0)
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [recording])

  const indicator = useMemo(
    () => (
      <FiberManualRecordIcon
        sx={{
          // Bright colors for strong visibility
          color: recording ? '#ff3b30' : '#22c55e',
          // subtle pulse when recording
          animation: recording ? 'pulse 1.25s ease-in-out infinite' : 'none',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', opacity: 0.9 },
            '50%': { transform: 'scale(1.15)', opacity: 0.6 },
            '100%': { transform: 'scale(1)', opacity: 0.9 },
          },
        }}
        fontSize="small"
      />
    ),
    [recording]
  )

  return (
    <div className="flex items-center gap-3">
      <Button
        size="medium"
        variant="contained"
        color="primary"
        onClick={async () => {
          if (busy) return
          setError(null)
          if (!recording) {
            // Start recording
            try {
              // Clear any previous upload/transcribe state and results immediately
              setTranscriptText(undefined)
              setNotesText(undefined)
              setProcessingTaskId(undefined)
              setTranscriptionTaskId(undefined)
              bumpResetUploadToken()
              setBusy(true)
              const resp = await startRecording({ separate_tracks: true, create_mixed: true, sample_rate: 48000, format: 'wav' })
              setRecordingTaskId(resp.recording_task_id)
              setRecording(true)
              logger.info('Recording started', resp)
              openSnack('Recording started', 'success')
            } catch (e: any) {
              setError(e?.message || 'Failed to start recording')
              logger.error('Start recording error', e)
              openSnack(`Start failed: ${e?.message || 'unknown error'}`, 'error')
            } finally {
              setBusy(false)
            }
          } else {
            // Stop recording
            try {
              if (!recordingTaskId) throw new Error('No recording task id')
              // Immediately enter stopping state and freeze timer/UI
              setStopping(true)
              if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null }
              setRecording(false)
              setBusy(true)
              const auto = postRecordingAction === 'auto-transcript'
              // Request stop without server auto-handoff to avoid backend env differences
              const stopResp = await stopRecording({ recording_task_id: recordingTaskId, auto_handoff: false })
              logger.info('Recording stopped', stopResp)
              setRecordingTaskId(undefined)

              if (auto) {
                setTranscriptText(undefined)
                setNotesText(undefined)
                openSnack('Auto transcription started…', 'info')
                // 1) Determine processing task id by waiting for detail completion and registering artifact
                setBusyStage('finalizing')
                const detail = await poll(
                  () => getRecordingDetail(stopResp.recording_task_id),
                  (d) => (d as any).status === 'completed' || (d as any).status === 'error',
                  { intervalMs: 1500, timeoutMs: 30 * 60 * 1000 }
                )
                if ((detail as any)?.status === 'error') {
                  const errs: string[] = []
                  if ((detail as any)?.error) errs.push(String((detail as any).error))
                  const warns = Array.isArray((detail as any)?.warnings) ? (detail as any).warnings : []
                  for (const w of warns) errs.push(String(w))
                  setStopItems(errs.length ? errs : ['Recording failed to finalize'])
                  setStopOpen(true)
                  openSnack(`Stop failed: ${(detail as any)?.error || 'finalization error'}`, 'error')
                  return
                }
                const summary = summarizeArtifacts((detail as any).artifacts)
                if (summary) openSnack(`Recording finalized: ${summary}` , 'success')
                let processingId = (detail as any)?.auto_handoff_result?.processing_task_id || undefined
                if (!processingId) {
                  const artifactPath = pickArtifactPath((detail as any).artifacts) || pickArtifactPath(stopResp.artifacts)
                  if (!artifactPath) throw new Error('No artifact to hand off')
                  const queued = await registerServerLocalPath(artifactPath, { source: 'recording', recording_task_id: stopResp.recording_task_id })
                  processingId = queued.processing_task_id
                }
                setProcessingTaskId(processingId)
                // 2) Poll processing
                setBusyStage('processing')
                await poll(
          () => getAudioProcessingStatus(processingId!),
          (s) => (s as any).status === 'completed' || (s as any).status === 'error',
          { intervalMs: 1200 }
        )
                // 3) Start transcription
                const started = await startTranscription(processingId!)
                setTranscriptionTaskId(started.transcription_task_id)
                // 4) Poll transcription and set text
                setBusyStage('transcribing')
                const final = await poll(
          () => getTranscription(started.transcription_task_id),
          (s) => (s as any).status === 'completed' || (s as any).status === 'error',
          { intervalMs: 1500 }
        )
                if ((final as any).status === 'completed') {
                  const segs = (final as any).result?.segments
                  let txt = ''
                  if (Array.isArray(segs) && segs.length > 0) {
                    let out: string[] = []
                    let currSpeaker = (segs[0]?.speaker || 'SPEAKER_00').toString()
                    let buffer: string[] = []
                    for (const s of segs) {
                      const sp = (s.speaker || currSpeaker || 'SPEAKER').toString()
                      if (sp !== currSpeaker) {
                        if (buffer.length) out.push(`${currSpeaker}: ${buffer.join(' ').trim()}`)
                        currSpeaker = sp
                        buffer = []
                      }
                      if (s.text) buffer.push(String(s.text).trim())
                    }
                    if (buffer.length) out.push(`${currSpeaker}: ${buffer.join(' ').trim()}`)
                    txt = out.join('\n')
                  } else {
                    txt = (final as any).result?.text || ''
                  }
                  setTranscriptText(txt)
                  logger.info('Auto transcription completed', { length: txt.length })
                  openSnack('Auto transcription completed', 'success')
                } else {
                  throw new Error((final as any).error || 'Transcription failed')
                }
              } else {
                // Download option selected: nothing further here. Transcript download is available in Results panel if/when present.
                // Wait for completion to provide a useful summary and path list
                setBusyStage('finalizing')
                const detail = await poll(
                  () => getRecordingDetail(stopResp.recording_task_id),
                  (d) => (d as any).status === 'completed' || (d as any).status === 'error',
                  { intervalMs: 1500, timeoutMs: 30 * 60 * 1000 }
                )
                const dany: any = detail
                const summary = summarizeArtifacts(dany.artifacts)
                if (summary) openSnack(`Recording finalized: ${summary}`, 'success')
                const p = pickArtifactPath(dany.artifacts)
                if (p) {
                  logger.info('Recording artifacts available', { artifacts: dany.artifacts })
                  // Fetch as blob to avoid saving error pages and ensure correct content
                  try {
                    const url = `/api/v1/recordings/${stopResp.recording_task_id}/download?artifact=best`
                    const blob = await fetchBlob(url)
                    const a = document.createElement('a')
                    const dlUrl = URL.createObjectURL(blob)
                    a.href = dlUrl
                    a.download = `${stopResp.recording_task_id}.wav`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(dlUrl)
                  } catch (err: any) {
                    openSnack(`Download failed: ${err?.message || 'error'}`, 'error')
                    // Fallback: provide paths file for manual access
                    const text = [
                      `mixed: ${dany?.artifacts?.mixed?.path || ''}`,
                      `system: ${dany?.artifacts?.system?.path || ''}`,
                      `mic: ${dany?.artifacts?.mic?.path || ''}`,
                    ].filter(Boolean).join('\n')
                    downloadTextFile('recording-paths.txt', `${text}\n`)
                  }
                }
              }
            } catch (e: any) {
              setError(e?.message || 'Failed to stop/handle recording')
              logger.error('Stop recording error', e)
              openSnack(`Stop failed: ${e?.message || 'unknown error'}`, 'error')
            } finally {
              setBusy(false)
              setBusyStage('idle')
              setStopping(false)
            }
          }
        }}
        aria-pressed={recording}
        disabled={busy || (!recording && !recordingReady)}
        sx={{ boxShadow: 1, display: 'flex', justifyContent: 'flex-end', gap: 1, minWidth: 180 }}
      >
        <span>{busy ? (recording ? 'Stopping…' : 'Starting…') : recording ? 'Stop Recording' : 'Start Recording'}</span>
        {indicator}
      </Button>

      {recording && (
        <Chip
          size="small"
          variant="filled"
          label={formatSeconds(seconds)}
          sx={{ bgcolor: '#ff3b30', color: '#ffffff', fontWeight: 600 }}
        />
      )}
      {!recording && (stopping || busy) && (
        <Chip
          size="small"
          color={busyStage === 'finalizing' ? 'warning' : busyStage === 'processing' ? 'info' : busyStage === 'transcribing' ? 'success' : 'primary'}
          variant="filled"
          label={busyStage === 'finalizing' ? 'Finalizing…' : busyStage === 'processing' ? 'Processing audio…' : busyStage === 'transcribing' ? 'Transcribing…' : 'Working…'}
        />
      )}
      {!recording && error && (
        <Chip size="small" color="error" variant="filled" label={error} />
      )}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={closeSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
      <Dialog open={stopOpen} onClose={() => setStopOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Recording Finalization Failed</DialogTitle>
        <DialogContent>
          <List dense>
            {stopItems.map((r, idx) => (
              <ListItem key={idx} disableGutters>
                <ListItemText primary={r} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopOpen(false)} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
      {/* Preflight dialog moved to dedicated PreflightCheck component */}
    </div>
  )
}
