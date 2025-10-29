import { useState, useEffect } from 'react'
import { generateEscapeRoom, generateEscapeRoomDemo, completeGame } from '../../services/api'
import { Loader, Lock, Unlock, Lightbulb, ChevronRight, Trophy, AlertCircle, ArrowLeft } from 'lucide-react'

function EscapeRoom({ student, onBack, isDemo = false }) {
  const [step, setStep] = useState(isDemo ? 'loading-demo' : 'config')
  const [form, setForm] = useState({ subject: '', topic: '' })
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentRoom, setCurrentRoom] = useState(0)
  const [answer, setAnswer] = useState('')
  const [roomsCompleted, setRoomsCompleted] = useState([])
  const [showHint, setShowHint] = useState(false)
  const [message, setMessage] = useState('')
  const [escaped, setEscaped] = useState(false)
  const [showCompletionNotification, setShowCompletionNotification] = useState(false)

  useEffect(() => {
    const loadDemoGame = async () => {
      setLoading(true)
      try {
        const response = await generateEscapeRoomDemo(student.id)
        if (response && response.data) {
          setGameData(response.data)
          setStep('playing')
        }
      } catch (error) {
        console.error('Error cargando escape room demo:', error)
        alert('Error al cargar el Escape Room de demostración')
        if (onBack) onBack()
      } finally {
        setLoading(false)
      }
    }

    if (isDemo && step === 'loading-demo') {
      loadDemoGame()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, step])

  const handleStartGame = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await generateEscapeRoom(student.id, form.subject, form.topic)
      setGameData(response.data)
      setStep('playing')
    } catch (error) {
      console.error('Error generando escape room:', error)
      alert('Error al generar el escape room. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return

    const room = gameData.rooms[currentRoom]
    const isCorrect = answer.trim().toLowerCase() === room.enigma.answer.toLowerCase()

    if (isCorrect) {
      setMessage('¡Correcto! 🎉')
      setShowHint(false)
      
      if (currentRoom === gameData.rooms.length - 1) {
        // Juego completado - guardar en progreso
        handleGameCompletion()
        setEscaped(true)
      } else {
        setTimeout(() => {
          setRoomsCompleted([...roomsCompleted, currentRoom])
          setCurrentRoom(currentRoom + 1)
          setAnswer('')
          setMessage('')
          setShowHint(false)
        }, 1500)
      }
    } else {
      setMessage('❌ Respuesta incorrecta. Intenta de nuevo.')
      setShowHint(true)
    }
  }

  const handleGameCompletion = async () => {
    const percentage = ((roomsCompleted.length + 1) / gameData.rooms.length) * 100
    try {
      await completeGame({
        student_id: student.id,
        game_type: 'escape-room',
        score: percentage,
        game_data: {
          rooms_completed: roomsCompleted.length + 1,
          total_rooms: gameData.rooms.length,
          percentage: percentage.toFixed(1)
        }
      })
      setShowCompletionNotification(true)
      setTimeout(() => {
        setShowCompletionNotification(false)
      }, 4000)
    } catch (error) {
      console.error('Error guardando juego completado:', error)
    }
  }

  const handleReset = () => {
    setGameData(null)
    setStep(isDemo ? 'loading-demo' : 'config')
    setCurrentRoom(0)
    setAnswer('')
    setRoomsCompleted([])
    setShowHint(false)
    setMessage('')
    setEscaped(false)
  }

  if (loading || step === 'loading-demo') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader className="h-12 w-12 animate-spin text-primary-600" />
        <p className="text-lg text-gray-600">
          {step === 'loading-demo' ? 'Cargando demo...' : 'Generando tu Escape Room Educativo...'}
        </p>
      </div>
    )
  }

  if (step === 'config') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a Juegos
        </button>

        <div className="card">
          <div className="text-center mb-8">
            <Lock className="h-16 w-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              🏛️ Escape Room Educativo
            </h2>
            <p className="text-gray-600">
              ¡Resuelve enigmas educativos para escapar de las 5 salas misteriosas!
            </p>
          </div>

          <form onSubmit={handleStartGame} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materia
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="input-field"
                placeholder="Ej: Matemáticas, Historia, Ciencias..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema específico
              </label>
              <input
                type="text"
                required
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="input-field"
                placeholder="Ej: Ecuaciones, Segunda Guerra Mundial..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              🔥 Generar Escape Room
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (escaped) {
    return (
      <div className="text-center py-12 relative">
        {/* Notificación de juego completado */}
        {showCompletionNotification && (
          <div 
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
            style={{
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 border-4 border-green-700 rounded-xl shadow-2xl p-6 max-w-md">
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-full p-3">
                  <Trophy className="h-10 w-10 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-1">🎉 ¡Juego Completado!</h4>
                  <p className="text-white/90 text-sm">Tu progreso ha sido guardado</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-8 max-w-2xl mx-auto">
          <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-green-700 mb-4">
            🎉 ¡HAS ESCAPADO!
          </h2>
          <p className="text-xl text-gray-700 mb-4">
            ¡Felicidades! Has resuelto todos los enigmas del
          </p>
            <p className="text-2xl font-bold text-orange-600 mb-6">
            {gameData?.title || 'Escape Room'}
          </p>
          
          <div className="bg-white p-6 rounded-lg mb-6">
            <p className="text-lg font-semibold text-gray-800 mb-2">
              Estadísticas:
            </p>
            <p className="text-gray-600">
              ✅ Salas completadas: {roomsCompleted.length + 1} / {gameData?.rooms?.length || 5}
            </p>
            <p className="text-gray-600">
              🎯 Tema: {gameData?.theme || 'N/A'}
            </p>
          </div>

          <button
            onClick={handleReset}
            className="btn-primary px-8 py-3"
          >
            🔄 Jugar de Nuevo
          </button>
        </div>
      </div>
    )
  }

  if (!gameData || !gameData.rooms) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg text-gray-600">Error: No se pudo cargar el juego</p>
        <button onClick={onBack} className="btn-secondary">
          Volver a Juegos
        </button>
      </div>
    )
  }

  const room = gameData.rooms[currentRoom]

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Volver a Juegos
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">{gameData.title}</h2>
        <p className="text-purple-100">{gameData.theme}</p>
        
        {/* Progress */}
        <div className="flex items-center gap-2 mt-4">
          {gameData.rooms.map((_, index) => (
            <div
              key={index}
              className={`h-3 flex-1 rounded-full transition-all ${
                roomsCompleted.includes(index) || index < currentRoom
                  ? 'bg-green-400'
                  : index === currentRoom
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-purple-300'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-purple-100 mt-2">
          Sala {currentRoom + 1} de {gameData.rooms.length}
        </p>
      </div>

      {/* Room Content */}
      <div className="bg-white rounded-b-2xl shadow-lg p-8">
        {/* Room Info */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            {roomsCompleted.includes(currentRoom) ? (
              <Unlock className="h-8 w-8 text-green-500" />
            ) : (
              <Lock className="h-8 w-8 text-purple-600" />
            )}
            <h3 className="text-2xl font-bold text-gray-900">
              Sala {room.number}: {room.name}
            </h3>
          </div>
          <p className="text-gray-700 mb-4 bg-gray-50 p-4 rounded-lg border-l-4 border-purple-600">
            {room.description}
          </p>
        </div>

        {/* Enigma */}
        <div className="mb-6 bg-purple-50 p-6 rounded-lg">
          <div className="flex items-start gap-3">
            <ChevronRight className="h-6 w-6 text-purple-600 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-3">{room.enigma.question}</p>
              {room.enigma.options && (
                <div className="space-y-2">
                  {room.enigma.options.map((option, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded border border-gray-200"
                    >
                      <span className="font-medium text-purple-600 mr-2">{String.fromCharCode(65 + idx)})</span>
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Answer Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu respuesta:
          </label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
            className="input-field"
            placeholder="Escribe tu respuesta aquí..."
          />
        </div>

        {/* Hint */}
        {showHint && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Pista:</p>
              <p className="text-yellow-700">{room.enigma.hint}</p>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg text-center font-semibold ${
            message.includes('Correcto')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmitAnswer}
          disabled={!answer.trim()}
          className="btn-primary w-full py-3 text-lg"
        >
          Comprobar Respuesta
        </button>
      </div>
    </div>
  )
}

export default EscapeRoom
