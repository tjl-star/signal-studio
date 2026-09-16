@echo off
setlocal
cd /d "%~dp0"
set PYTHONPATH=backend
.venv\Scripts\python.exe -m app.cli import-bl-consumption --source-file "source-data\content_growth_tabs.json"
pause
