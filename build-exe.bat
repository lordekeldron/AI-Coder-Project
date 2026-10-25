@echo off
REM ============================================================
REM  build-exe.bat — build the Windows .exe installer on Windows
REM
REM  Run this on a Windows machine (or Windows VM) with Node.js
REM  installed. It installs dependencies, builds the web bundle,
REM  and produces the installer in the \release folder.
REM ============================================================

setlocal

echo.
echo ========================================
echo   AI Programming Agent - Windows build
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js not found. Install LTS from https://nodejs.org and re-run.
  exit /b 1
)

echo [+] Installing dependencies...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo [X] Dependency install failed.
  exit /b 1
)

echo [+] Building web bundle...
call npm run build
if errorlevel 1 (
  echo [X] Build failed.
  exit /b 1
)

echo [+] Packaging Windows .exe (this downloads Electron on first run)...
call npm run dist:win
if errorlevel 1 (
  echo [X] Packaging failed.
  exit /b 1
)

echo.
echo ========================================
echo   Done! Installer is in the \release folder.
echo   Look for AIProgrammingAgent-Setup-1.0.0.exe
echo ========================================
echo.
endlocal
