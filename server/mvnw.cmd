@echo off
setlocal

REM Chronos lightweight Maven wrapper.
REM The PowerShell bootstrap downloads Maven into server/.mvn/wrapper,
REM then runs the pinned Maven version with this project's settings.xml.

set "SCRIPT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%.mvn\wrapper\mvnw-bootstrap.ps1" %*
exit /b %ERRORLEVEL%
