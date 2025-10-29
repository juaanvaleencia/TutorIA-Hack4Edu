#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║        🔄 REINICIANDO TUTORIA COMPLETAMENTE 🔄       ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Paso 1: Detener procesos existentes
echo "📛 Deteniendo procesos existentes..."
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2
echo "✅ Procesos detenidos"
echo ""

# Paso 2: Verificar que los archivos existen
echo "🔍 Verificando archivos..."
if [ ! -f "backend/main.py" ]; then
    echo "❌ ERROR: backend/main.py no encontrado"
    exit 1
fi

if [ ! -f "frontend/src/components/games/EscapeRoom.jsx" ]; then
    echo "❌ ERROR: EscapeRoom.jsx no encontrado"
    exit 1
fi

if [ ! -f "frontend/src/components/games/Ahorcado.jsx" ]; then
    echo "❌ ERROR: Ahorcado.jsx no encontrado"
    exit 1
fi

echo "✅ Todos los archivos encontrados"
echo ""

# Paso 3: Iniciar Backend
echo "🚀 Iniciando Backend..."
echo ""
cd backend
source venv/bin/activate
python -c "import sys; print(f'Python: {sys.version}')"
echo ""
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend inicie
echo "⏳ Esperando a que el backend inicie..."
sleep 5

# Verificar que el backend está corriendo
if ! curl -s http://localhost:8000/ > /dev/null; then
    echo "❌ ERROR: El backend no está respondiendo"
    echo "Por favor, verifica los logs arriba"
    exit 1
fi
echo "✅ Backend iniciado correctamente"
echo ""

# Paso 4: Probar endpoints
echo "🧪 Probando endpoints nuevos..."
echo ""

# Test escape-room-demo
echo "Testing /api/games/escape-room-demo..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/games/escape-room-demo \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1}')

if [ "$RESPONSE" = "404" ]; then
    echo "❌ Escape Room Demo: 404 - Endpoint no encontrado"
elif [ "$RESPONSE" = "200" ]; then
    echo "✅ Escape Room Demo: Funcionando"
else
    echo "⚠️  Escape Room Demo: Código $RESPONSE"
fi

# Test ahorcado-demo
echo "Testing /api/games/ahorcado-demo..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/games/ahorcado-demo \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1}')

if [ "$RESPONSE" = "404" ]; then
    echo "❌ Ahorcado Demo: 404 - Endpoint no encontrado"
elif [ "$RESPONSE" = "200" ]; then
    echo "✅ Ahorcado Demo: Funcionando"
else
    echo "⚠️  Ahorcado Demo: Código $RESPONSE"
fi

echo ""

# Paso 5: Iniciar Frontend
echo "🚀 Iniciando Frontend..."
echo ""
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 3

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║              ✅ TUTORIA INICIADO ✅                   ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:8000"
echo ""
echo "📝 Para ver logs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "⛔ Para detener:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🎉 ¡Listo! Abre http://localhost:5173 en tu navegador"
echo ""

