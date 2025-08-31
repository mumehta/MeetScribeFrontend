import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { styled } from '@mui/material/styles'
import { useAppStore } from '../store/useAppStore'
import {
  uploadAudio,
  getAudioProcessingStatus,
  startTranscription,
  getTranscription,
  generateNotes,
  poll,
} from '../api/transcription'
import { logger } from '../lib/logger'

const CardRoot = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
}))

const DropZone = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: 12,
  padding: theme.spacing(4),
  cursor: 'pointer',
  transition: 'border-color 150ms ease, background-color 150ms ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(2,6,23,0.02)',
  },
}))

export default function UploadTranscribeCard() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const transcriptBtnRef = useRef<HTMLButtonElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [processing, setProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [transcriptCompleted, setTranscriptCompleted] = useState<boolean>(false)
  const [step, setStep] = useState<'idle' | 'transcribing' | 'notes'>('idle')
  const {
    setProcessingTaskId,
    setTranscriptionTaskId,
    setTranscriptText,
    setNotesText,
  } = useAppStore()

  const onPick = () => inputRef.current?.click()

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }, [])

  const handleFile = (f: File) => {
    const validTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/mp4',
      'audio/m4a',
      'audio/x-m4a',
      'video/mp4',
      'audio/webm',
      'video/webm',
    ]
    const t = f.type || ''
    const broadOk = t.startsWith('audio/') || t.startsWith('video/')
    const allow = broadOk || validTypes.includes(t)
    if (!allow) {
      setError('Unsupported file type. Please upload audio/video files (e.g., MP3, WAV, MP4, WebM, M4A).')
      return
    }
    logger.info('File selected', { name: f.name, size: f.size, type: f.type })
    setFile(f)
    setProgress(0)
    setTranscriptCompleted(false)
    setError(null)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const reset = () => {
    setFile(null)
    setProgress(0)
    setProcessing(false)
    setError(null)
    setTranscriptCompleted(false)
    setStep('idle')
    if (inputRef.current) inputRef.current.value = ''
  }

  // Auto-focus the Transcript button once a file is chosen
  useEffect(() => {
    if (file && transcriptBtnRef.current) {
      transcriptBtnRef.current.focus()
    }
  }, [file])

  const simulateProgress = () => {
    setProgress(2)
    const start = Date.now()
    const timer = setInterval(() => {
      setProgress((p) => {
        const elapsed = Date.now() - start
        const next = Math.min(95, Math.max(p + 1, Math.floor(elapsed / 80)))
        return next
      })
    }, 120)
    return () => clearInterval(timer)
  }

  const startTranscript = async () => {
    if (!file || processing || transcriptCompleted) return
    setStep('transcribing')
    setProcessing(true)
    setTranscriptText(undefined)
    setNotesText(undefined)
    const stop = simulateProgress()
    try {
      logger.info('Step: upload+transcribe start')
      // 1) Upload
      const queued = await uploadAudio(file)
      setProcessingTaskId(queued.processing_task_id)
      // 2) Poll audio processing until completed
      await poll(
        () => getAudioProcessingStatus(queued.processing_task_id),
        (s) => s.status === 'completed' || s.status === 'error',
        { intervalMs: 1200 }
      )
      // 3) Start transcription
      const started = await startTranscription(queued.processing_task_id)
      setTranscriptionTaskId(started.transcription_task_id)
      // 4) Poll transcription
      const final = await poll(
        () => getTranscription(started.transcription_task_id),
        (s) => s.status === 'completed' || s.status === 'error',
        { intervalMs: 1500 }
      )
      if (final.status === 'completed') {
        const txt = final.result?.text || ''
        setTranscriptText(txt)
        setTranscriptCompleted(true)
        logger.info('Transcription completed', { length: txt.length })
      } else {
        setError(final.error || 'Transcription failed.')
        logger.warn('Transcription failed', final)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to transcribe. Please try again.')
      logger.error('Transcription error', e)
    } finally {
      stop()
      setProgress(100)
      setProcessing(false)
      setStep('idle')
      logger.info('Step: upload+transcribe end')
    }
  }

  const startNotes = async () => {
    if (!file || processing || !transcriptCompleted) return
    setStep('notes')
    setProcessing(true)
    const stop = simulateProgress()
    try {
      // Use latest transcription task id from store
      logger.info('Step: notes start')
      const resp = await generateNotes(useAppStore.getState().transcriptionTaskId!)
      const notes = resp?.notes_result?.notes
      if (resp?.notes_result?.status === 'completed' && notes) {
        setNotesText(notes)
        logger.info('Notes generated', { length: notes.length })
      } else {
        setError(resp?.notes_result?.error || 'Failed to generate notes.')
        logger.warn('Notes generation failed', resp)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to generate notes. Please try again.')
      logger.error('Notes error', e)
    } finally {
      stop()
      setProgress(100)
      setProcessing(false)
      setStep('idle')
      logger.info('Step: notes end')
    }
  }

  return (
    <CardRoot className="shadow-sm">
      {/* Action chips */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <IconButton size="small" color="primary" aria-label="upload">
          <CloudUploadIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label="add more">
          <AddCircleOutlineIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label="reset" onClick={reset} disabled={!file && !processing}>
          <RestartAltIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Typography variant="h6" fontWeight={700} gutterBottom>
        Upload & Transcribe
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload an audio or video file. We’ll generate a transcript and AI meeting notes.
      </Typography>

      <DropZone
        onClick={onPick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        aria-label="Upload drop area"
      >
        <Stack spacing={1} alignItems="center">
          <CloudUploadIcon color="primary" />
          <Typography variant="body2" color="text.secondary">
            {file ? file.name : 'Drop your audio/video here or click to browse.'}
          </Typography>
        </Stack>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*"
          hidden
          onChange={onChange}
        />
      </DropZone>

      <Stack direction="row" alignItems="center" sx={{ mt: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Button
            variant={file && !transcriptCompleted && step !== 'notes' ? 'contained' : 'outlined'}
            color="primary"
            onClick={startTranscript}
            disabled={!file || processing || transcriptCompleted}
            ref={transcriptBtnRef}
          >
            Generate Transcript
          </Button>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
          {processing && (
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {step === 'transcribing' ? 'Generating transcription…' : 'Generating AI meeting notes…'}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={startNotes}
            disabled={!file || processing || !transcriptCompleted}
          >
            Generate Meeting Notes
          </Button>
        </Box>
      </Stack>

      {processing && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant={progress > 0 && progress < 100 ? 'determinate' : 'indeterminate'} value={progress} />
        </Box>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}

      {/* Optional animated waveform while processing */}
      {processing && (
        <Box sx={{ mt: 2 }}>
          <div className="waveform" aria-hidden>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </Box>
      )}
    </CardRoot>
  )
}
