import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

export interface AppState {
  sidebarOpen: boolean
  setSidebarOpen: (sidebarOpen: boolean) => void
  recording: boolean
  setRecording: (recording: boolean) => void
  postRecordingAction: 'auto-transcript' | 'download'
  setPostRecordingAction: (v: 'auto-transcript' | 'download') => void
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
  // Transcription flow state
  processingTaskId?: string
  transcriptionTaskId?: string
  transcriptText?: string
  notesText?: string
  setProcessingTaskId: (id?: string) => void
  setTranscriptionTaskId: (id?: string) => void
  setTranscriptText: (t?: string) => void
  setNotesText: (t?: string) => void
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('themeMode') as ThemeMode | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  recording: false,
  setRecording: (recording) => set({ recording }),
  postRecordingAction: 'auto-transcript',
  setPostRecordingAction: (v) => set({ postRecordingAction: v }),
  themeMode: getInitialTheme(),
  setThemeMode: (mode) => {
    if (typeof window !== 'undefined') window.localStorage.setItem('themeMode', mode)
    set({ themeMode: mode })
  },
  toggleTheme: () => {
    const next: ThemeMode = get().themeMode === 'light' ? 'dark' : 'light'
    if (typeof window !== 'undefined') window.localStorage.setItem('themeMode', next)
    set({ themeMode: next })
  },
  setProcessingTaskId: (processingTaskId) => set({ processingTaskId }),
  setTranscriptionTaskId: (transcriptionTaskId) => set({ transcriptionTaskId }),
  setTranscriptText: (transcriptText) => set({ transcriptText }),
  setNotesText: (notesText) => set({ notesText }),
}))
