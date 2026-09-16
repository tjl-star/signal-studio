@echo off
setlocal
cd /d "%~dp0"
set "PYTHONPATH=%~dp0backend"
".venv\Scripts\python.exe" -m app.cli import-overview --source-dir "source-data"
if errorlevel 1 pause & exit /b 1
echo [Signal Studio] 数据更新完成。
pause
