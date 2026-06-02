@echo off
chcp 65001 >nul
cd /d %~dp0\desktop

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo ERRO: Node.js nao encontrado. Instale o Node.js LTS.
  pause
  exit /b 1
)

if not exist node_modules call npm install

echo Gerando instalador .EXE do Fixora ERP...
call npm run build

if %errorlevel% neq 0 (
  echo ERRO ao gerar instalador.
  pause
  exit /b 1
)

echo Instalador gerado em desktop\dist
pause
