@echo off
title Travello Backend Server
echo Starting Travello C# backend server...
cd /d "%~dp0"
dotnet watch run
if %ERRORLEVEL% neq 0 (
    echo.
    echo Watch failed, trying standard run...
    dotnet run
)
pause
