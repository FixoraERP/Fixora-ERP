@echo off
chcp 65001 >nul
cd /d %~dp0
echo Instalando Fixora ERP Pro...

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js nao encontrado. Instale o Node.js LTS: https://nodejs.org
  pause
  exit /b 1
)

call npm install
if %errorlevel% neq 0 (
  echo Erro ao instalar dependencias WEB.
  pause
  exit /b 1
)

cd desktop
call npm install
if %errorlevel% neq 0 (
  echo Erro ao instalar dependencias DESKTOP.
  pause
  exit /b 1
)

cd ..
echo Instalacao concluida.
pause
