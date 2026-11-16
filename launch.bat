@echo off
title TimePass Arcade Launcher
cls
echo ========================================================
echo               TIMEPASS ARCADE LAUNCHER
echo ========================================================
echo Starting local web server on port 8000...
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Opening TimePass Arcade in your default browser...
start "" "http://localhost:8000"

echo.
echo Server running at http://localhost:8000
echo Close this window to stop the server.
echo.
node server.js
pause

