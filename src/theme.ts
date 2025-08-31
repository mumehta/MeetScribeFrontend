import { createTheme } from '@mui/material/styles'

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // Tailwind brand-500 hex (cannot use CSS var here)
    },
    secondary: {
      main: '#0ea5e9', // sky-500-ish
    },
    background: {
      default: '#f9fafb', // gray-50
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'var(--font-sans)',
  },
  shape: {
    borderRadius: 10,
  },
})