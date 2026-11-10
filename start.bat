@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Starting RANDOM.APT SEOUL on http://localhost:3800 ...
start "" "http://localhost:3800"
node server.js
pause
