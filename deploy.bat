@echo off
REM ============================================
REM Deploy manual desde Windows
REM Uso: deploy.bat
REM Requiere: ssh configurado con la clave de Oracle
REM ============================================

echo ==========================================
echo   Deploy Consultorio Psique a Oracle
echo ==========================================

REM Primero push a GitHub
echo.
echo [1/3] Subiendo cambios a GitHub...
git add -A
git commit -m "Deploy: %date% %time%" 2>nul
git push origin main

REM Luego ejecutar deploy en el servidor via SSH
echo.
echo [2/3] Conectando al servidor Oracle...
ssh -o StrictHostKeyChecking=no oracle-psique "cd /opt/psique/app && git pull origin main && cd deploy && docker compose -f docker-compose.prod.yml build --no-cache app && docker compose -f docker-compose.prod.yml up -d && docker image prune -f"

echo.
echo [3/3] Deploy completado!
echo.
pause
