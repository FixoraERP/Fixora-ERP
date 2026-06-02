@echo off
chcp 65001 >nul
cd /d %~dp0
if not exist node_modules call npm install
echo Abrindo em http://localhost:3000
call npm run dev
pause
