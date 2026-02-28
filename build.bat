@echo off
REM Script de build para aplicación monolítica (Windows)

echo 🚀 Iniciando build de aplicación monolítica...

REM 1. Compilar frontend
echo 📦 Compilando frontend...
cd frontend
call npm install
call npm run build
cd ..

REM 2. Compilar backend (Maven copiará el frontend automáticamente)
echo 🔨 Compilando backend con Maven...
cd backend
call mvn clean package -DskipTests
cd ..

echo ✅ Build completado!
echo 📁 JAR generado en: backend\target\*.jar
echo.
echo Para ejecutar:
echo   java -jar backend\target\consultorio-turnos-1.0.0.jar
echo.
echo O con Docker:
echo   docker-compose up --build

pause
