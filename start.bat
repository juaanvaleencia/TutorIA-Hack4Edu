@echo off
REM Script de inicio rápido para TutorIA en Windows
REM Este script inicia tanto el backend como el frontend

echo.
echo ===========================================
echo   Iniciando TutorIA
echo ===========================================
echo.

REM Verificar si existe el entorno virtual del backend
if not exist "backend\venv\" (
    echo [ERROR] No se encontro el entorno virtual de Python.
    echo Por favor, ejecuta primero:
    echo   cd backend
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)

REM Verificar si existen node_modules del frontend
if not exist "frontend\node_modules\" (
    echo [ERROR] No se encontraron las dependencias de Node.js.
    echo Por favor, ejecuta primero:
    echo   cd frontend
    echo   npm install
    pause
    exit /b 1
)

REM Verificar que existe el archivo .env en backend
if not exist "backend\.env" (
    echo [ERROR] No se encontro el archivo .env en backend\
    echo Por favor, crea el archivo backend\.env con tu API key de OpenAI
    echo Puedes copiar backend\.env.example como plantilla
    pause
    exit /b 1
)

echo [OK] Iniciando Backend (FastAPI)...
cd backend
start "TutorIA Backend" cmd /k "venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
cd ..

timeout /t 3 /nobreak > nul

echo [OK] Iniciando Frontend (React + Vite)...
cd frontend
start "TutorIA Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ===========================================
echo   TutorIA esta corriendo!
echo ===========================================
echo.
echo Accede a la aplicacion en:
echo   http://localhost:5173
echo.
echo Documentacion de la API:
echo   http://localhost:8000/docs
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause > nul

start http://localhost:5173

echo.
echo Para detener los servidores, cierra las ventanas correspondientes
echo.
pause

