@echo off
setlocal
cd /d "%~dp0"
set PYTHONPATH=backend
.venv\Scripts\python.exe -m app.cli import-resources --source-dir "source-data"
pause
