@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)
rem Some machines (corporate proxy / antivirus TLS inspection) install a root CA
rem that Node's bundled cert store doesn't trust. This tells Node to also trust
rem the OS certificate store, without disabling verification.
set "NODE_OPTIONS=--use-system-ca"
npm run dev
