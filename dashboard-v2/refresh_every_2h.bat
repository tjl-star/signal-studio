@echo off
setlocal
set "ROOT=%~dp0"
set "PY=C:\Users\tjldq\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%PY%" (
  echo Bundled Python runtime not found: "%PY%"
  exit /b 1
)
if not exist "%ROOT%logs" mkdir "%ROOT%logs"
for /f %%D in ('powershell -NoProfile -Command "(Get-Date).AddDays(-1).ToString('yyyy-MM-dd')"') do set "DAY=%%D"
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('DATA_PROVIDER_CORE_PASSWORD','User')"`) do set "DATA_PROVIDER_CORE_PASSWORD=%%V"
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('QUICKBI_MCP_TOKEN','User')"`) do set "QUICKBI_MCP_TOKEN=%%V"
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('QUICKBI_MCP_USER_ID','User')"`) do set "QUICKBI_MCP_USER_ID=%%V"
set "STATUS=0"
"%PY%" "%ROOT%refresh_current_daily_snapshot.py" --date "%DAY%" >> "%ROOT%logs\refresh_every_2h.log" 2>&1
if errorlevel 1 set "STATUS=1"
"%PY%" "%ROOT%update_daily_data.py" --start-date "%DAY%" --end-date "%DAY%" --apply >> "%ROOT%logs\refresh_every_2h.log" 2>&1
if errorlevel 1 set "STATUS=1"
"%PY%" "%ROOT%..\backend\refresh_growth_snapshots.py" >> "%ROOT%logs\refresh_every_2h.log" 2>&1
if errorlevel 1 set "STATUS=1"
exit /b %STATUS%
