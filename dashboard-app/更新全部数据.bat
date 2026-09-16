@echo off
setlocal
cd /d "%~dp0"
set "PYTHONPATH=%~dp0backend"
if not defined SIGNAL_STUDIO_RUNTIME_DIR set "SIGNAL_STUDIO_RUNTIME_DIR=%LOCALAPPDATA%\SignalStudio"
".venv\Scripts\python.exe" -m app.cli import-all --source-dir "source-data"
if errorlevel 1 pause & exit /b 1
".venv\Scripts\python.exe" -m app.cli sync-mcp
if errorlevel 1 pause & exit /b 1
echo [Signal Studio] 本地快照与 Quick BI MCP 数据更新完成。
pause
