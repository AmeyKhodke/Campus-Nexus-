@echo off
REM Campus Nexus - Docker Startup Script for Windows

echo.
echo ========================================
echo   Campus Nexus - Docker Setup
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [✓] Docker found
echo.

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: docker-compose not found, using docker compose
    set COMPOSE_CMD=docker compose
) else (
    set COMPOSE_CMD=docker-compose
)

echo.
echo Building Docker image...
echo.

%COMPOSE_CMD% build

if errorlevel 1 (
    echo ERROR: Failed to build Docker image
    pause
    exit /b 1
)

echo.
echo [✓] Build successful
echo.
echo Starting Campus Nexus application...
echo.
echo ========================================
echo   Application will be available at:
echo   http://localhost:5173
echo ========================================
echo.

%COMPOSE_CMD% up

pause
