import { AppBar, Toolbar, IconButton, Typography, Container, Paper, Tooltip } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import { alpha, styled } from '@mui/material/styles'
import UploadTranscribeCard from './components/UploadTranscribeCard'
import ResultsPanel from './components/ResultsPanel'
import { useAppStore } from './store/useAppStore'

const Card = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
}))

export default function App() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const { themeMode, toggleTheme } = useAppStore()
  

  return (
    <div className="min-h-screen">
      <AppBar
        position="sticky"
        color="transparent"
        sx={{
          backdropFilter: 'blur(8px)',
          backgroundColor: (t) => alpha(t.palette.background.paper, 0.8),
          position: 'sticky',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: 'linear-gradient(90deg, #7c3aed, #6366f1, #3b82f6)',
            opacity: 0.05,
            zIndex: -1,
          },
        }}
      >
        <Toolbar className="max-w-screen-xl mx-auto w-full">
          <IconButton edge="start" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className="ml-2 flex-1">Meet Scribe</Typography>
          <div className="flex items-center gap-2">
            <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton onClick={toggleTheme} aria-label="toggle theme" size="large">
                {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </div>
        </Toolbar>
      </AppBar>

      <Container className="py-6">
        <div className="grid gap-6">
          {/* Hero glass card */}
          <Card className="shadow-sm" sx={{
            backdropFilter: 'blur(14px)',
            backgroundColor: (t) => t.palette.mode === 'dark'
              ? 'rgba(17,24,39,0.6)'
              : 'rgba(255,255,255,0.7)',
            border: (t) => `1px solid ${t.palette.divider}`,
          }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Welcome to Meet Scribe
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload an audio or video file and we’ll generate a high‑quality transcript and AI‑crafted meeting notes.
            </Typography>
          </Card>

          {/* Upload card as the main second card */}
          <UploadTranscribeCard />

          {/* Side-by-side results: Transcript + Meeting Notes */}
          <ResultsPanel />
        </div>
      </Container>
    </div>
  )
}