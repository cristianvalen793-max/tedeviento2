@echo off
title TopUp Zone — Servidor Local
echo.
echo   ========================================
echo    TopUp Zone - Iniciando servidor local
echo   ========================================
echo.
cd /d "%~dp0"
echo   Abriendo el sitio en tu navegador...
echo   Presiona Ctrl+C para cerrar el servidor.
echo.
node server.js
pause
