import { Button, Paper, Stack, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { useAppStore } from '../store/useAppStore'
import { useEffect } from 'react'
import { logger } from '../lib/logger'

const Card = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 260,
}))

const ContentBox = styled('div')(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 10,
  padding: theme.spacing(2),
  background:
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(2,6,23,0.02)',
}))

export default function ResultsPanel() {
  const { transcriptText, notesText } = useAppStore()

  useEffect(() => {
    if (typeof transcriptText === 'string') {
      logger.info('Transcript updated', { length: transcriptText.length })
    }
  }, [transcriptText])

  useEffect(() => {
    if (typeof notesText === 'string') {
      logger.info('Notes updated', { length: notesText.length })
    }
  }, [notesText])

  const downloadText = (text: string, filename: string) => {
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      logger.info('Download triggered', { filename, length: text.length })
    } catch (e: any) {
      logger.error('Download failed', { filename, error: e?.message || String(e) })
    }
  }

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <Card className="shadow-sm" sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Transcript
        </Typography>
        <ContentBox>
          <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
            {transcriptText || 'Your transcript will appear here after processing.'}
          </Typography>
        </ContentBox>
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button variant="outlined" disabled={!transcriptText} onClick={() => downloadText(transcriptText!, 'transcript.txt')}>
            Download Transcript
          </Button>
        </Stack>
      </Card>

      <Card className="shadow-sm" sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Meeting Notes
        </Typography>
        <ContentBox>
          <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
            {notesText || 'AI-generated meeting notes will appear here after processing.'}
          </Typography>
        </ContentBox>
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button variant="outlined" disabled={!notesText} onClick={() => downloadText(notesText!, 'meeting-notes.txt')}>
            Download Notes
          </Button>
        </Stack>
      </Card>
    </Stack>
  )
}
