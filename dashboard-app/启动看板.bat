@echo off
setlocal
cd /d "%~dp0"
set "PYTHONPATH=%~dp0backend"
if not defined SIGNAL_STUDIO_RUNTIME_DIR set "SIGNAL_STUDIO_RUNTIME_DIR=%LOCALAPPDATA%\SignalStudio"
if not exist ".venv\Scripts\python.exe" (
  echo [Signal Studio] 缺少本地 Python 环境，请先运行：py -3 -m venv .venv
  pause
  exit /b 1
)
if not exist "%SIGNAL_STUDIO_RUNTIME_DIR%\signal-studio-v1.db" (
  echo [Signal Studio] 首次导入全部看板数据...
  ".venv\Scripts\python.exe" -m app.cli import-all --source-dir "source-data"
  if errorlevel 1 pause & exit /b 1
)
start "Signal Studio" /min ".venv\Scripts\python.exe" -m app.cli serve --host 127.0.0.1 --port 8765
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/"
echo [Signal Studio] 已启动：http://127.0.0.1:8765/
