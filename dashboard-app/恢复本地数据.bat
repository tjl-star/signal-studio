@echo off
setlocal
cd /d "%~dp0"
set "PYTHONPATH=%~dp0backend"
if not defined SIGNAL_STUDIO_RUNTIME_DIR set "SIGNAL_STUDIO_RUNTIME_DIR=%LOCALAPPDATA%\SignalStudio"
echo 恢复会覆盖当前本地数据库。请先关闭 Signal Studio 服务。
set /p "ARCHIVE=请输入备份 ZIP 的完整路径："
if not exist "%ARCHIVE%" echo 备份文件不存在。& pause & exit /b 1
set /p "CONFIRM=确认覆盖当前数据？请输入 RESTORE："
if /i not "%CONFIRM%"=="RESTORE" echo 已取消。& pause & exit /b 0
".venv\Scripts\python.exe" -m app.cli restore --archive "%ARCHIVE%" --confirm
if errorlevel 1 pause & exit /b 1
echo [Signal Studio] 恢复完成。
pause
