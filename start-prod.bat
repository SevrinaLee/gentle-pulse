@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)
set "NODE_OPTIONS=--use-system-ca"
call npm run build
npm run start
