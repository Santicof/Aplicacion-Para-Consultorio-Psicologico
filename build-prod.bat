@echo off
echo ========================================
echo   Build para Produccion - Railway
echo ========================================
echo.

echo [1/4] Construyendo Frontend...
cd frontend
call npm install
call npm run build
if errorlevel 1 (
    echo ERROR: Fallo el build del frontend
    exit /b 1
)
cd ..

echo.
echo [2/4] Copiando frontend al backend...
if not exist "backend\src\main\resources\static" mkdir "backend\src\main\resources\static"
xcopy /E /Y /I "frontend\dist\*" "backend\src\main\resources\static\"
if errorlevel 1 (
    echo ERROR: Fallo la copia de archivos
    exit /b 1
)

echo.
echo [3/4] Construyendo Backend...
cd backend
call mvn clean package -DskipTests
if errorlevel 1 (
    echo ERROR: Fallo el build del backend
    exit /b 1
)
cd ..

echo.
echo [4/4] Build completado!
echo.
echo El JAR esta en: backend\target\consultorio-turnos-1.0.0.jar
echo.
echo Para ejecutar localmente:
echo   java -jar backend\target\consultorio-turnos-1.0.0.jar
echo.
echo Para Railway, haz push a GitHub y conecta el repo.
echo ========================================
