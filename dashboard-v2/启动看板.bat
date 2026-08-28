@echo off
setlocal
where python >nul 2>&1
if errorlevel 1 (echo Python 3 is required. Please install Python and try again.&pause&exit /b 1)
set "ROOT=%~dp0"
start "dashboard-v2 server" python -m http.server 8000 --bind 127.0.0.1 --directory "%ROOT%"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8000/?v=dashboard"
endlocal
