# Generating the Windows .exe

The app is packaged as a desktop application using **Electron**. Because a
valid Windows `.exe` must be built on Windows (or with a Windows CI runner),
the build runs on **your** Windows machine — not in the cloud editor.

## Prerequisites

- **Windows 10/11** (or a Windows VM)
- **Node.js 18+ LTS** — https://nodejs.org
- ~1 GB free disk (Electron binary + build cache)

## One-command build

Download the project to your Windows machine, open a terminal in the project
folder, and run:

```bat
build-exe.bat
```

Or, manually:

```bat
npm install
npm run dist:win
```

The installer appears in the `release\` folder:

```
release\AIProgrammingAgent-Setup-1.0.0.exe
```

Double-click it to install like any Windows app — it creates a Start Menu
shortcut, a desktop shortcut, and an uninstaller.

## What the `.exe` contains

- The full web UI (built with Vite into `dist/`)
- The Electron runtime, which wraps the UI in a native desktop window
- Your Supabase credentials (read from the `.env` that's bundled at build time)

## Environment variables

The desktop app reads the same `.env` values as the web version
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). These are embedded into the
bundle at build time, so fill in `.env` **before** running `npm run dist:win`.

## Other platforms

| Command | Output |
|---|---|
| `npm run dist:win` | Windows `.exe` installer (NSIS) |
| `npm run dist:mac` | macOS `.dmg` |
| `npm run dist:linux` | Linux `.AppImage` |

## Development mode

To run the app in a desktop window with hot-reload during development:

```bat
npm install
npm run electron:dev
```

This starts Vite and opens an Electron window pointed at the local dev server.
