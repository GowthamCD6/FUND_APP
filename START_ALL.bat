@echo off
REM This script will start MySQL and create database with proper admin elevation

setlocal enabledelayedexpansion

REM Check if running as admin
net session >nul 2>&1
if errorlevel 1 (
    echo.
    echo Requesting Administrator Privileges...
    echo.
    
    REM Create VBScript for elevation
    set "tempVBS=%temp%\elevation.vbs"
    (
        echo Set objShell = CreateObject("Shell.Application"^)
        echo objShell.ShellExecute "cmd.exe", "/c cd /d ""%~dp0"" && ""%~f0""", "", "runas", 1
    ) > "!tempVBS!"
    
    cscript //nologo "!tempVBS!"
    del "!tempVBS!" 2>nul
    exit /b
)

REM ========== Now running as ADMIN ==========

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║     Starting MySQL Service...                      ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Start MySQL service
echo Starting MySQL92...
net start MySQL92 >nul 2>&1

if errorlevel 1 (
    echo Trying alternate start method...
    sc start MySQL92 >nul 2>&1
)

echo ✅ MySQL service command sent
echo Waiting for MySQL to initialize...
timeout /t 5 /nobreak

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║     Creating Database Schema...                    ║
echo ╚════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"
node setup-database.js

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║     Setup Complete!                               ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo Next: Run "node server.js" in Backend folder
echo.

timeout /t 3