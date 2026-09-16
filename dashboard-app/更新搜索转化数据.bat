@echo off
setlocal
cd /d "%~dp0"
set PYTHONPATH=backend
.venv\Scripts\python.exe -m app.cli import-search-conversion --source-file "source-data\search_overall_conversion_20260701_20260825.json"
pause
