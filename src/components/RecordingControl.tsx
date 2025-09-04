import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Chip } from '@mui/material'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { useAppStore } from '../store/useAppStore'

function formatSeconds(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function RecordingControl() {
  const { recording, setRecording } = useAppStore()
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<number | null>(null)

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
        onClick={() => setRecording(!recording)}
        aria-pressed={recording}
        sx={{ boxShadow: 1, display: 'flex', justifyContent: 'flex-end', gap: 1, minWidth: 160 }}
      >
        <span>{recording ? 'Stop Recording' : 'Start Recording'}</span>
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
    </div>
  )
}
