@echo off
title Pitchside - publish update
cd /d "%~dp0"
echo.
echo === Pitchside: publishing the update ===
echo (national teams, league tables, lineups fix)
echo.
where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed on this computer.
  echo 1. Open https://git-scm.com/download/win
  echo 2. Install it, clicking Next on every screen.
  echo 3. Double-click this file again.
  echo.
  pause
  exit /b 1
)
if not exist "%~dp0pitchside-update.bundle" (
  echo I cannot find pitchside-update.bundle next to this file.
  echo Unzip the whole zip first, then double-click this file inside the unzipped folder.
  pause
  exit /b 1
)
set "REPO="
for %%P in ("%USERPROFILE%\sports-app" "%USERPROFILE%\Documents\sports-app" "%USERPROFILE%\Desktop\sports-app" "%USERPROFILE%\Documents\GitHub\sports-app" "%USERPROFILE%\Downloads\sports-app") do (
  if not defined REPO if exist "%%~P\.git" set "REPO=%%~P"
)
if not defined REPO (
  echo No sports-app folder found on this computer, so I will download the code.
  echo If a browser window opens asking you to sign in to GitHub, sign in as sanzdelcastillo.
  echo.
  git clone https://github.com/sanzdelcastillo/sports-app "%USERPROFILE%\Documents\sports-app"
  if errorlevel 1 ( echo The download failed. Take a photo of this window and send it to Claude. & pause & exit /b 1 )
  set "REPO=%USERPROFILE%\Documents\sports-app"
)
echo Using the code folder: %REPO%
cd /d "%REPO%"
git checkout main >nul 2>nul
git pull --ff-only
if errorlevel 1 ( echo Could not get the latest code. Nothing was changed. Send Claude a photo of this window. & pause & exit /b 1 )
git fetch "%~dp0pitchside-update.bundle" main
if errorlevel 1 ( echo Could not read the update file. Nothing was changed. Send Claude a photo of this window. & pause & exit /b 1 )
git merge --ff-only FETCH_HEAD
if errorlevel 1 ( echo The update did not fit on top of the current code. Nothing was uploaded. Send Claude a photo of this window. & pause & exit /b 1 )
echo.
echo Uploading to GitHub. If a browser window opens, sign in to GitHub as sanzdelcastillo.
git push origin main
if errorlevel 1 ( echo. & echo The upload FAILED. Take a photo of this window and send it to Claude. & pause & exit /b 1 )
echo.
echo ============================================
echo  DONE. The live app updates in about a minute.
echo ============================================
pause
