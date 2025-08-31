# Meet Scribe Frontend

This is a modern React + Vite + TypeScript frontend for uploading audio/video, generating high‑quality transcripts, and creating AI‑crafted meeting notes.

## Features

- __Upload & Transcribe__: drag-and-drop audio/video, progress feedback, validation
- __Two-step flow__: Generate Transcript → Generate Meeting Notes
- __Results__: Side-by-side Transcript and Meeting Notes cards with download buttons
- __Theming__: Professional light/dark themes, persisted theme toggle
- __Design polish__: Glass hero, subtle gradient AppBar, Inter webfont

## Tech Stack

- React 19, TypeScript, Vite
- MUI v5 (theming/components), Tailwind CSS utilities
- Zustand (global store), React Query (available), Fetch API

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or pnpm/yarn
- Backend Meeting Transcriber API running (see `openapi.yml`)

## Getting Started

1) __Install dependencies__

```bash
npm install
```

2) __Environment variables__

Create `.env` in the project root with your backend base URL (no path):

```env
VITE_API_BASE_URL=http://localhost:8000
```

3) __Run the app__

```bash
npm run dev
```

Open the printed localhost URL. Ensure the backend is reachable at `VITE_API_BASE_URL`.

## Quickstart with Makefile

If you prefer using `make`, the project ships with a Makefile that wraps common tasks.

1) **Clone and enter the project directory**
   ```bash
   git clone <repo-url>
   cd MeetScribeFrontend
   ```

2) **Install dependencies**
   ```bash
   make install
   ```

3) **Create and configure environment file**
   ```bash
   cp .env.example .env
   # Edit .env as needed (backend URL, logging)
   # Required:
   #   VITE_API_BASE_URL=http://localhost:8000
   # Optional logging:
   #   VITE_LOG_LEVEL=info
   #   VITE_ENABLE_SERVER_LOGS=false
   #   VITE_LOG_ENDPOINT=http://localhost:8000/api/v1/logs
   #   VITE_LOG_BATCH_MS=4000
   ```
   You can verify loaded variables with:
   ```bash
   make env
   ```

4) **Start the dev server**
   ```bash
   make dev
   ```
   Open the printed URL (typically http://localhost:5173). Ensure your backend is running and accessible at `VITE_API_BASE_URL`.

5) **(Optional) Generate API client from openapi.yml**
   ```bash
   make gen-api
   ```

6) **Production build and preview**
   ```bash
   make build
   make preview
   ```

7) **Lint and type-check**
   ```bash
   make lint
   make typecheck
   ```

8) **Clean build output**
   ```bash
   make clean-dist
   ```

Notes:
- To persist logs to backend files (e.g., `./logs/frontend-YYYY-MM-DD.log`), enable the optional logging sink in `.env` and implement the `POST /api/v1/logs` FastAPI endpoint as described below in “Logging and Error Handling”.
- Restart `make dev` after changing `.env` so Vite reloads variables.

## Scripts

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Project Structure

- `src/App.tsx` — application shell and layout
- `src/components/UploadTranscribeCard.tsx` — upload + actions (Transcript, Meeting Notes)
- `src/components/ResultsPanel.tsx` — side-by-side transcript/notes with downloads
- `src/store/useAppStore.ts` — global state: theme, task IDs, transcript/notes
- `src/api/http.ts` — base fetcher handling env and JSON/FormData
- `src/api/transcription.ts` — endpoints + polling helpers
- `src/lib/theme.ts` — light/dark MUI themes with Inter font
- `src/index.css` — utilities (glass, brand gradient, waveform)

## How the Flow Works

1. User uploads a file in `UploadTranscribeCard`.
2. Click __Generate Transcript__:
   - Calls `uploadAudio(file)`
   - Polls `/api/v1/audio-processing/{task_id}` until `completed`
   - Starts transcription via `/api/v1/transcribe/{processing_task_id}`
   - Polls `/api/v1/transcribe/{task_id}` to `completed` → saves `transcriptText` in the store
3. Click __Generate Meeting Notes__:
   - Calls `/api/v1/generate-notes/{transcription_task_id}`
   - Stores `notesText` in the store
4. `ResultsPanel` reads store values and enables downloads.

## Configuration Tips

- Inter webfont is loaded via Google Fonts in `index.html`.
- Theme mode is persisted in `localStorage` under `themeMode`.
- If you see network errors, verify `VITE_API_BASE_URL` and that CORS is enabled on your backend.

## Logging and Error Handling

- **Console logging**: Implemented via `src/lib/logger.ts` with levels `debug|info|warn|error|silent`.
  - Configure in `.env`:
    ```env
    VITE_LOG_LEVEL=info
    ```
  - View in browser DevTools → Console. Entries are prefixed with `[MeetScribe][ISO timestamp]`.

- **Network and UI instrumentation**:
  - `src/api/http.ts` — logs request start, success (with duration), and errors with details.
  - `src/api/transcription.ts` — logs upload start/queued, transcription start, notes generation.
  - `src/components/UploadTranscribeCard.tsx` — logs user actions, steps start/end, errors.
  - `src/components/ResultsPanel.tsx` — logs transcript/notes updates and downloads.

- **Global error handling**:
  - `src/components/ErrorBoundary.tsx` wraps the app to catch render errors.
  - `src/main.tsx` registers global `error` and `unhandledrejection` handlers and logs `App init`.

- **Optional backend log sink**: send logs to your API to persist to files (e.g., `./logs/frontend-YYYY-MM-DD.log`).
  - Enable in frontend `.env`:
    ```env
    VITE_ENABLE_SERVER_LOGS=true
    VITE_LOG_ENDPOINT=http://localhost:8000/api/v1/logs
    VITE_LOG_BATCH_MS=4000
    ```
  - Implement a FastAPI endpoint to receive POSTed JSON and append to `./logs/` (see `app/routers/logs.py` example in the PR/discussion).
  - Ensure CORS allows the frontend origin.

## Troubleshooting

- __Blank page or theme crash__: ensure `src/lib/theme.ts` is used and colors are valid.
- __Network 404/500__: confirm backend is running at `VITE_API_BASE_URL` and matches paths in `openapi.yml`.
- __CORS issues__: enable CORS on the backend.
- __Types not found__: run `npm install` and restart the dev server.

## License

Proprietary – internal use for the Meet Scribe project unless stated otherwise.
