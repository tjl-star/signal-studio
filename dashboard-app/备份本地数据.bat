@echo off
setlocal
cd /d "%~dp0"
set "PYTHONPATH=%~dp0backend"
if not defined SIGNAL_STUDIO_RUNTIME_DIR set "SIGNAL_STUDIO_RUNTIME_DIR=%LOCALAPPDATA%\SignalStudio"
".venv\Scripts\python.exe" -m app.cli backup --output-dir "%USERPROFILE%\Documents\SignalStudio备份"
if errorlevel 1 pause & exit /b 1
echo [Signal Studio] 备份已保存到 Documents\SignalStudio备份。
pause
