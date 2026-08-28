@echo off
setlocal
where python >nul 2>&1
if errorlevel 1 (echo Python 3 is required. Please install Python and try again.&pause&exit /b 1)
set "ROOT=%~dp0"
echo Starting dashboard at http://0.0.0.0:8000/
echo Share the machine IP or a reverse-tunnel URL; do not share localhost.
start "dashboard-v2 shared server" python -m http.server 8000 --bind 0.0.0.0 --directory "%ROOT%"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8000/?v=dashboard"
endlocal
