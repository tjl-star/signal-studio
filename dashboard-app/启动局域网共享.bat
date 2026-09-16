@echo off
setlocal
cd /d "%~dp0"
set "PYTHONPATH=%~dp0backend"
if not defined SIGNAL_STUDIO_RUNTIME_DIR set "SIGNAL_STUDIO_RUNTIME_DIR=%LOCALAPPDATA%\SignalStudio"
if not exist "%SIGNAL_STUDIO_RUNTIME_DIR%\signal-studio-v1.db" (
  ".venv\Scripts\python.exe" -m app.cli import-all --source-dir "source-data"
  if errorlevel 1 pause & exit /b 1
)
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object {$_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown'} ^| Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LAN_IP=%%I"
echo [Signal Studio] 本机访问：http://127.0.0.1:8765/
if defined LAN_IP echo [Signal Studio] 局域网访问：http://%LAN_IP%:8765/
echo 仅在可信局域网使用；Windows 防火墙如有提示请选择允许专用网络。
".venv\Scripts\python.exe" -m app.cli serve --host 0.0.0.0 --port 8765
