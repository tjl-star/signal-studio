@echo off
setlocal
set "ROOT=%~dp0"
set "PY=C:\Users\tjldq\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%PY%" (
  echo Bundled Python runtime not found: "%PY%"
  exit /b 1
)
pushd "%ROOT%" || exit /b 1
if not exist "logs" mkdir "logs"
for /f %%D in ('powershell -NoProfile -Command "(Get-Date).AddDays(-1).ToString('yyyy-MM-dd')"') do set "DAY=%%D"
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('DATA_PROVIDER_CORE_PASSWORD','User')"`) do set "DATA_PROVIDER_CORE_PASSWORD=%%V"
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('QUICKBI_MCP_TOKEN','User')"`) do set "QUICKBI_MCP_TOKEN=%%V"
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('QUICKBI_MCP_USER_ID','User')"`) do set "QUICKBI_MCP_USER_ID=%%V"
set "STATUS=0"
rem update_daily_data.py now owns the complete pipeline: core modules,
rem seasonPlayVV daily snapshots, BL, weekly and growth-tab derivatives.
rem Keep this as one process so separate cmd.exe invocations cannot race on
rem Chinese workspace paths or replace the same snapshot concurrently.
"%PY%" "update_daily_data.py" --start-date "%DAY%" --end-date "%DAY%" --apply >> "logs\refresh_every_2h.log" 2>&1
if errorlevel 1 set "STATUS=1"
popd
exit /b %STATUS%
