@echo off
setlocal
cd /d "%~dp0"
set "PYTHONPATH=%~dp0backend"
if not defined SIGNAL_STUDIO_RUNTIME_DIR set "SIGNAL_STUDIO_RUNTIME_DIR=%LOCALAPPDATA%\SignalStudio"
".venv\Scripts\python.exe" -m app.cli sync-mcp %*
if errorlevel 1 pause & exit /b 1
echo [Signal Studio] Quick BI MCP 数据同步完成。
pause
