#!/bin/bash

# Script de inicio rápido para TutorIA
# Este script inicia tanto el backend como el frontend

echo "🎓 Iniciando TutorIA..."
echo ""

# Función para manejar Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT

# Verificar si existe el entorno virtual del backend
if [ ! -d "backend/venv" ]; then
    echo "⚠️  No se encontró el entorno virtual de Python."
    echo "Por favor, ejecuta primero:"
    echo "  cd backend"
    echo "  python -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

# Verificar si existen node_modules del frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  No se encontraron las dependencias de Node.js."
    echo "Por favor, ejecuta primero:"
    echo "  cd frontend"
    echo "  npm install"
    exit 1
fi

# Verificar que existe el archivo .env en backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No se encontró el archivo .env en backend/"
    echo "Por favor, crea el archivo backend/.env con tu API key de OpenAI"
    echo "Puedes copiar backend/.env.example como plantilla"
    exit 1
fi

echo "✅ Iniciando Backend (FastAPI)..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "✅ Backend iniciado en http://localhost:8000"
echo ""

sleep 2

echo "✅ Iniciando Frontend (React + Vite)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "✅ Frontend iniciado en http://localhost:5173"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 TutorIA está corriendo!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Accede a la aplicación en:"
echo "   👉 http://localhost:5173"
echo ""
echo "📚 Documentación de la API:"
echo "   👉 http://localhost:8000/docs"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "Presiona Ctrl+C para detener los servidores"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Esperar indefinidamente
wait

