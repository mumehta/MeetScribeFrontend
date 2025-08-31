import { createTheme } from '@mui/material/styles';

// Light theme
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' }, // blue-600
    secondary: { main: '#7c3aed' }, // violet-600
    background: {
      default: '#f7f7fb', // subtle light bg
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // slate-900
      secondary: '#475569', // slate-600
    },
    divider: 'rgba(2, 6, 23, 0.08)',
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
      },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', borderRadius: 10, fontWeight: 600 } },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(2, 6, 23, 0.06)' },
      },
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6' }, // blue-500
    secondary: { main: '#8b5cf6' }, // violet-500
    background: {
      default: '#0b1220', // near-slate
      paper: '#111827', // slate-900
    },
    text: {
      primary: '#e5e7eb', // zinc-200
      secondary: '#9ca3af', // gray-400
    },
    divider: 'rgba(255,255,255,0.12)',
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
      },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', borderRadius: 10, fontWeight: 600 } },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(255,255,255,0.08)' },
      },
    },
  },
});