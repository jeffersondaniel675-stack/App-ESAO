@echo off
chcp 65001 >nul
setlocal
title Intendencia - ESAO 2026
cd /d "%~dp0"

echo ============================================================
echo   Intendencia - ESAO 2026
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo.
  echo Instale o Node.js 20 ou superior em https://nodejs.org
  echo e depois execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODEVER=%%v
echo Node.js encontrado: %NODEVER%
echo.

if not exist "node_modules" (
  echo Primeira execucao: instalando dependencias. Isso pode levar alguns minutos...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
  echo.
)

echo Iniciando o sistema...
echo Quando aparecer "Server initialized on port 3000", o sistema estara pronto.
echo Para encerrar, feche esta janela ou pressione Ctrl+C.
echo.

start "" http://localhost:3000
call npm run dev

echo.
echo O sistema foi encerrado.
pause
