@echo off
setlocal
cd /d "%~dp0"
set PYTHONPATH=backend
.venv\Scripts\python.exe -m app.cli import-genre-contribution --source-file "source-data\content_growth_tabs.json"
pause
