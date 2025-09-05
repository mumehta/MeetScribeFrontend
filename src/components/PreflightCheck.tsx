import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Tooltip,
} from '@mui/material'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { recordingPreflight } from '../api/recordings'
import { useAppStore } from '../store/useAppStore'
import { logger } from '../lib/logger'

export default function PreflightCheck() {
  const { recordingReady, setRecordingReady } = useAppStore()
  const [showSuccess, setShowSuccess] = useState(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function run() {
    setError(null)
    setBusy(true)
    try {
      const res = await recordingPreflight()
      setData(res)
      setOpen(true)
      logger.info('Preflight result', res)
      // Determine compliance immediately from fresh response and update global state
      const ok = Boolean(
        res &&
        res.has_blackhole &&
        res.has_multi_output_device &&
        res.default_output_is_multi_output &&
        res.microphone_access_granted &&
        Array.isArray(res.recommendations) &&
        res.recommendations.length === 0,
      )
      setRecordingReady(ok)
    } catch (e: any) {
      logger.error('Preflight error', e)
      setError(e?.message || 'Failed to run preflight checks')
      setOpen(true)
      setData(null)
      setRecordingReady(false)
    } finally {
      setBusy(false)
    }
  }

  function StatusItem({ ok, label }: { ok: boolean; label: string }) {
    return (
      <ListItem dense disableGutters>
        <ListItemIcon sx={{ minWidth: 28 }}>
          {ok ? (
            <CheckCircleIcon sx={{ color: '#22c55e' }} fontSize="small" />
          ) : (
            <ErrorOutlineIcon color="error" fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText primary={label} />
      </ListItem>
    )
  }

  const allGood = Boolean(
    data &&
      data.has_blackhole &&
      data.has_multi_output_device &&
      data.default_output_is_multi_output &&
      data.microphone_access_granted &&
      Array.isArray(data.recommendations) &&
      data.recommendations.length === 0,
  )

  const recs: string[] = Array.isArray(data?.recommendations)
    ? data!.recommendations.filter((r: any) => typeof r === 'string' && r.trim())
    : []

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data ?? {}, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  // When recordingReady flips true, briefly show success chip then hide it
  useEffect(() => {
    if (!recordingReady) return
    setShowSuccess(true)
    const t = setTimeout(() => setShowSuccess(false), 3500)
    return () => clearTimeout(t)
  }, [recordingReady])

  // If verified and success message has timed out, render nothing
  if (recordingReady && !showSuccess) return null

  // If verified and we are within the display window, show success chip
  if (recordingReady && showSuccess) {
    return (
      <Chip
        color="success"
        variant="filled"
        label="Recording setup verified — ready to record"
        sx={{ fontWeight: 600 }}
      />
    )
  }

  return (
    <>
      <Button
        size="medium"
        variant="contained"
        color="primary"
        startIcon={busy ? <CircularProgress size={16} /> : <FactCheckIcon />}
        onClick={run}
        disabled={busy}
        sx={{ boxShadow: 1, minWidth: 210 }}
      >
        {busy ? 'Checking setup…' : 'Check Recording Setup'}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Recording Setup Check</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {data && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={allGood ? 'Ready to record' : 'Needs setup'}
                  color={allGood ? 'success' : 'warning'}
                  variant="filled"
                  size="small"
                />
                <Tooltip title="Copy raw JSON">
                  <IconButton size="small" onClick={copyJson}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <List dense>
                <StatusItem ok={!!data.has_blackhole} label="BlackHole virtual device installed" />
                <StatusItem ok={!!data.has_multi_output_device} label="Multi‑Output device present" />
                <StatusItem ok={!!data.default_output_is_multi_output} label="Default Output is set to Multi‑Output" />
                <StatusItem ok={!!data.microphone_access_granted} label="Microphone access granted" />
              </List>

              {recs.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    Action recommended before recording
                  </Alert>
                  <List dense>
                    {recs.map((r, idx) => (
                      <ListItem key={idx} disableGutters>
                        <ListItemText primary={r} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Box component="pre" sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'action.hover', fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(data, null, 2)}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={copied} autoHideDuration={1200} onClose={() => setCopied(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled">Copied JSON</Alert>
      </Snackbar>
    </>
  )
}
