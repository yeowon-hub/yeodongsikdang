@echo off
cd /d "%~dp0"

if exist "C:\Program Files\nodejs\node.exe" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js를 찾을 수 없습니다. https://nodejs.org 에서 설치해 주세요.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo 의존성이 없습니다. 먼저 npm install 을 실행해 주세요.
  if exist "C:\Program Files\nodejs\npm.cmd" (
    call "C:\Program Files\nodejs\npm.cmd" install
  ) else (
    pause
    exit /b 1
  )
)

node scripts/run-dev.mjs
