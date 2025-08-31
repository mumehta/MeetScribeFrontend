import { Button, Typography, Paper } from '@mui/material'
import { styled } from '@mui/material/styles'
import { useAppStore } from '../store/useAppStore'

const Wrapper = styled(Paper)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  alignItems: 'center',
}))

export default function RecorderPanel() {
  const { recording } = useAppStore()

  return (
    <Wrapper className="p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <Typography variant="subtitle1" fontWeight={600}>Recorder</Typography>
        <Typography variant="caption" color="text.secondary">{recording ? 'Recording…' : 'Idle'}</Typography>
      </div>
      <Typography variant="body2" color="text.secondary">
        Recording will be available in a later step. This is a placeholder UI.
      </Typography>

      <div className="flex gap-2" aria-disabled>
        <Button variant="contained" color="primary" disabled title="Coming soon">
          Start
        </Button>
        <Button variant="outlined" disabled title="Coming soon">
          Stop
        </Button>
      </div>
    </Wrapper>
  )
}