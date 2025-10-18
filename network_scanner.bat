@echo off
REM Network Scanner Script for Windows
REM This script pings a target and performs nmap scan if target is reachable

set /p target="Enter the target IP or hostname: "

if "%target%"=="" (
    echo Error: No target specified
    exit /b 1
)

echo Scanning target: %target%
echo Pinging target...

ping -n 1 %target% >nul 2>&1
if %errorlevel%==0 (
    echo Target is reachable! Fetching detailed information...
    echo Running nmap scan...
    nmap -sV -sC %target%
) else (
    echo Target is unreachable or dead
    exit /b 1
)
