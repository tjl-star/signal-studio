@echo off
setlocal
cd /d "%~dp0"
set "PYTHONPATH=%~dp0backend"
".venv\Scripts\python.exe" -m app.cli import-content-ranking --source-file "source-data\站内播放排名Top30_20260706_20260804.json"
if errorlevel 1 pause & exit /b 1
echo [Signal Studio] 内容榜单更新完成。
pause
