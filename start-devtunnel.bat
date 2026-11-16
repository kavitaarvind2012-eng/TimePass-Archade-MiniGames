@echo off
setlocal
title TimePass Arcade Dev Tunnel
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or is not in PATH.
    echo Install Node.js, then run this file again.
    pause
    exit /b 1
)

where devtunnel >nul 2>nul
if errorlevel 1 (
    echo [ERROR] The Dev Tunnels CLI is not installed or is not in PATH.
    echo Install the Microsoft Dev Tunnels CLI, then run this file again.
    echo If needed, sign in with: devtunnel user login
    pause
    exit /b 1
)

if not exist "node_modules\socket.io\package.json" (
    echo Installing the arcade server dependency...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
)

powershell -NoProfile -Command "try { $site = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://localhost:8000/'; $socket = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://localhost:8000/socket.io/socket.io.js'; if ($site.Content.Contains('TimePass Arcade') -and $socket.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>nul
if errorlevel 1 (
    echo Starting TimePass Arcade on port 8000...
    start "TimePass Arcade Server" /D "%~dp0" cmd /k node server.js

    echo Waiting for the server to start...
    set "SERVER_READY="
    for /l %%i in (1,1,30) do (
        powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://localhost:8000/'; if ($r.StatusCode -eq 200 -and $r.Content.Contains('TimePass Arcade')) { exit 0 } } catch {}; exit 1" >nul 2>nul
        if not errorlevel 1 set "SERVER_READY=1"
        if defined SERVER_READY goto server_ready
        timeout /t 1 /nobreak >nul
    )

    echo [ERROR] TimePass Arcade did not start on port 8000.
    echo Check the separate server window for the error.
    pause
    exit /b 1
)

echo Reusing the TimePass Arcade server already running on port 8000.

:server_ready
echo.
echo Starting the public Dev Tunnel for port 8000.
echo Keep this window open while friends are using the tunnel.
echo If this is your first time, sign in with: devtunnel user login
echo.
devtunnel host -p 8000 --protocol http --allow-anonymous

echo.
echo The Dev Tunnel has stopped. The local server window may still be open.
pause
