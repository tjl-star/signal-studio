@echo off
setlocal
set "ROOT=%~dp0"
set "PY=C:\Users\tjldq\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%PY%" (echo Bundled Python runtime not found: "%PY%"&pause&exit /b 1)
pushd "%ROOT%" || exit /b 1
echo Starting dashboard at http://0.0.0.0:8000/
echo Share the machine IP or a reverse-tunnel URL; do not share localhost.
set "NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%NODE%" start "hot ranking API" "%NODE%" "%ROOT%..\backend\hot_ranking_server.mjs"
start "dashboard-v2 shared server" "%PY%" -m http.server 8000 --bind 0.0.0.0
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8000/?v=dashboard"
popd
endlocal
