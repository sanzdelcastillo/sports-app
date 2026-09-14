@echo off
REM Double-click on Windows to run Pitchside on your Wi-Fi so your phone can open it.
cd /d "%~dp0"
echo === Pitchside - local test server ===
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org (LTS), then run this again.
  pause & exit /b 1
)
if not exist node_modules (
  echo First run: installing, about a minute...
  call npm install
)
if not exist .env.local (
  echo.
  echo No .env.local yet - running with the FREE data key (one game per club).
  echo For full data: copy .env.example to .env.local and paste your API-Football key.
  echo.
)
echo.
echo Starting. Look for a line like:   Network: http://192.168.1.23:5173/
echo Open that address in the browser on your phone (same Wi-Fi). Close this window to stop.
echo.
call npm run dev
