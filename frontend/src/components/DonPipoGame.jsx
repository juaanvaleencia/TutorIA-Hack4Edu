import { useState, useEffect } from 'react'
import { X, Heart, Zap, Apple, BookOpen, Trophy, Star, Smile, HelpCircle } from 'lucide-react'

function DonPippoGame({ onClose, student }) {
  // Estado de Don Pippo (se guarda en localStorage)
  const [pippoStats, setPippoStats] = useState({
    hambre: 80,      // 0-100
    energia: 75,     // 0-100
    felicidad: 85,   // 0-100
    conocimiento: 60, // 0-100
    nivel: 1,
    experiencia: 0,
    lastUpdate: Date.now()
  })

  const [gameMode, setGameMode] = useState('home') // 'home', 'feed', 'play', 'study', 'quiz', 'select-action'
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [resultCorrect, setResultCorrect] = useState(false)
  const [actionUnlocked, setActionUnlocked] = useState(false) // Si se desbloqueó una acción
  const [pendingAction, setPendingAction] = useState(null) // Acción que el usuario quiere hacer

  // Preguntas educativas simples
  const questions = [
    {
      question: "¿Cuánto es 5 + 3?",
      options: ["6", "7", "8", "9"],
      correct: "8",
      reward: { conocimiento: 5, felicidad: 3 }
    },
    {
      question: "¿Cuál es la capital de España?",
      options: ["Barcelona", "Madrid", "Valencia", "Sevilla"],
      correct: "Madrid",
      reward: { conocimiento: 5, felicidad: 3 }
    },
    {
      question: "¿Cuántos continentes hay?",
      options: ["5", "6", "7", "8"],
      correct: "7",
      reward: { conocimiento: 5, felicidad: 3 }
    },
    {
      question: "¿Qué planeta es el más cercano al Sol?",
      options: ["Venus", "Tierra", "Mercurio", "Marte"],
      correct: "Mercurio",
      reward: { conocimiento: 5, felicidad: 3 }
    },
    {
      question: "¿Cuánto es 12 - 7?",
      options: ["4", "5", "6", "7"],
      correct: "5",
      reward: { conocimiento: 5, felicidad: 3 }
    },
    {
      question: "¿Qué color se forma mezclando azul y amarillo?",
      options: ["Verde", "Naranja", "Morado", "Rojo"],
      correct: "Verde",
      reward: { conocimiento: 5, felicidad: 3 }
    }
  ]

  // Cargar estado guardado
  useEffect(() => {
    const saved = localStorage.getItem('donPippoStats')
    if (saved) {
      const parsedStats = JSON.parse(saved)
      // Actualizar stats basado en tiempo transcurrido
      updateStatsOverTime(parsedStats)
    }
  }, [])

  // Guardar estado
  useEffect(() => {
    localStorage.setItem('donPippoStats', JSON.stringify(pippoStats))
  }, [pippoStats])

  // Actualizar stats con el paso del tiempo
  const updateStatsOverTime = (stats) => {
    const now = Date.now()
    const hoursPassed = (now - stats.lastUpdate) / (1000 * 60 * 60)
    
    // Disminuir stats con el tiempo (máximo -30 por stat)
    const decrease = Math.min(hoursPassed * 2, 30)
    
    setPippoStats({
      ...stats,
      hambre: Math.max(0, stats.hambre - decrease),
      energia: Math.max(0, stats.energia - decrease),
      felicidad: Math.max(0, stats.felicidad - decrease / 2),
      lastUpdate: now
    })
  }

  // Preparar acción (requiere responder pregunta primero)
  const prepareAction = (action) => {
    setPendingAction(action)
    startQuiz()
  }

  // Ejecutar acción desbloqueada
  const executeAction = (action) => {
    switch(action) {
      case 'feed':
        setPippoStats(prev => ({
          ...prev,
          hambre: Math.min(100, prev.hambre + 15),
          felicidad: Math.min(100, prev.felicidad + 5),
          experiencia: prev.experiencia + 3,
          lastUpdate: Date.now()
        }))
        showNotification('¡Ñam ñam! 🍎 Don Pippo está feliz')
        break
      case 'play':
        setPippoStats(prev => ({
          ...prev,
          felicidad: Math.min(100, prev.felicidad + 12),
          energia: Math.max(0, prev.energia - 8),
          experiencia: prev.experiencia + 3,
          lastUpdate: Date.now()
        }))
        showNotification('¡Qué divertido! 🎉 Don Pippo se divirtió')
        break
      case 'rest':
        setPippoStats(prev => ({
          ...prev,
          energia: Math.min(100, prev.energia + 20),
          experiencia: prev.experiencia + 2,
          lastUpdate: Date.now()
        }))
        showNotification('💤 Don Pippo descansó bien')
        break
    }
    setActionUnlocked(false)
    setPendingAction(null)
    setGameMode('home')
  }

  // Iniciar quiz
  const startQuiz = () => {
    const randomQ = questions[Math.floor(Math.random() * questions.length)]
    setCurrentQuestion(randomQ)
    setUserAnswer('')
    setShowResult(false)
    setGameMode('quiz')
  }

  // Responder pregunta
  const answerQuestion = (answer) => {
    setUserAnswer(answer)
    const correct = answer === currentQuestion.correct
    setResultCorrect(correct)
    setShowResult(true)

    if (correct) {
      setTimeout(() => {
        setPippoStats(prev => ({
          ...prev,
          conocimiento: Math.min(100, prev.conocimiento + currentQuestion.reward.conocimiento),
          felicidad: Math.min(100, prev.felicidad + currentQuestion.reward.felicidad),
          experiencia: prev.experiencia + 8,
          nivel: Math.floor((prev.experiencia + 8) / 100) + 1,
          lastUpdate: Date.now()
        }))
        
        // Si hay una acción pendiente, ir a seleccionar acción
        if (pendingAction === 'study') {
          // Si era solo estudiar, volver al home
          setPendingAction(null)
          setGameMode('home')
        } else if (pendingAction) {
          // Si era otra acción, ir a la pantalla de selección
          setActionUnlocked(true)
          setGameMode('select-action')
        } else {
          // Si no había acción pendiente (estudio directo), volver al home
          setGameMode('home')
        }
      }, 2000)
    } else {
      setTimeout(() => {
        setPippoStats(prev => ({
          ...prev,
          felicidad: Math.max(0, prev.felicidad - 10),
          energia: Math.max(0, prev.energia - 15),
          hambre: Math.max(0, prev.hambre - 8),
          lastUpdate: Date.now()
        }))
        setPendingAction(null)
        setActionUnlocked(false)
        setGameMode('home')
      }, 2000)
    }
  }

  const showNotification = (message) => {
    // Podrías implementar un sistema de notificaciones más elaborado
    console.log(message)
  }

  // Obtener estado/ánimo de Don Pippo
  const getPippoMood = () => {
    const stats = [pippoStats.hambre, pippoStats.energia, pippoStats.felicidad, pippoStats.conocimiento]
    
    // Contar estados por nivel
    const redCount = stats.filter(s => s < 33).length    // Rojo: < 33%
    const yellowCount = stats.filter(s => s >= 33 && s < 66).length  // Amarillo: 33-66%
    const greenCount = stats.filter(s => s >= 66).length  // Verde: >= 66%
    
    // Contento: Todos los estados están altos (verde)
    if (greenCount === 4) {
      return { 
        emoji: '😊', 
        text: 'Contento', 
        color: 'text-green-600',
        image: '/don-pippo-contento.gif'
      }
    }
    
    // Enfadado: 1 o más estados en rojo Y al menos 1 en amarillo
    if (redCount >= 1 && yellowCount >= 1) {
      return { 
        emoji: '😡', 
        text: 'Enfadado', 
        color: 'text-red-600',
        image: '/don-pippo-enfadado.gif'
      }
    }
    
    // Triste: 2 o más estados en amarillo
    if (yellowCount >= 2) {
      return { 
        emoji: '😢', 
        text: 'Triste', 
        color: 'text-yellow-600',
        image: '/don-pippo-triste.gif'
      }
    }
    
    // Estado por defecto (cuando no cumple ninguna condición exacta)
    // Por ejemplo: solo 1 amarillo, o solo 1 rojo, o mezclas variadas
    if (redCount >= 2) {
      return { 
        emoji: '😡', 
        text: 'Enfadado', 
        color: 'text-red-600',
        image: '/don-pippo-enfadado.gif'
      }
    }
    
    return { 
      emoji: '😢', 
      text: 'Triste', 
      color: 'text-yellow-600',
      image: '/don-pippo-triste.gif'
    }
  }

  const mood = getPippoMood()

  // Barra de estadística
  const StatBar = ({ icon: Icon, label, value, color }) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-bold text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            value > 66 ? 'bg-green-500' : value > 33 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              🏛️ Cuida a Don Pippo
            </h2>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                <span className="text-sm font-semibold">Nivel {pippoStats.nivel}</span>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                <span className="text-sm font-semibold">⭐ {pippoStats.experiencia} XP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Pantalla Principal */}
          {gameMode === 'home' && (
            <>
              {/* Don Pippo Animado */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={mood.image}
                    alt={`Don Pippo - ${mood.text}`}
                    className="w-48 h-48 rounded-full border-4 border-amber-300 shadow-xl mx-auto"
                  />
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                    <span className="text-3xl">{mood.emoji}</span>
                  </div>
                </div>
                <p className={`text-xl font-bold mt-3 ${mood.color}`}>
                  {mood.text}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  ¡Ayúdame respondiendo preguntas!
                </p>
              </div>

              {/* Estadísticas */}
              <div className="bg-white rounded-xl p-4 shadow-md mb-6">
                <StatBar icon={Apple} label="Hambre" value={pippoStats.hambre} color="text-red-500" />
                <StatBar icon={Zap} label="Energía" value={pippoStats.energia} color="text-yellow-500" />
                <StatBar icon={Smile} label="Felicidad" value={pippoStats.felicidad} color="text-pink-500" />
                <StatBar icon={BookOpen} label="Conocimiento" value={pippoStats.conocimiento} color="text-blue-500" />
              </div>

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => prepareAction('feed')}
                  className="bg-gradient-to-br from-red-400 to-red-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Apple className="h-8 w-8 mx-auto mb-2" />
                  <span className="font-bold">Alimentar</span>
                  <p className="text-xs mt-1 opacity-90">Responde para desbloquear</p>
                </button>

                <button
                  onClick={() => prepareAction('play')}
                  className="bg-gradient-to-br from-pink-400 to-pink-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Heart className="h-8 w-8 mx-auto mb-2" />
                  <span className="font-bold">Jugar</span>
                  <p className="text-xs mt-1 opacity-90">Responde para desbloquear</p>
                </button>

                <button
                  onClick={() => prepareAction('rest')}
                  className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Zap className="h-8 w-8 mx-auto mb-2" />
                  <span className="font-bold">Dormir</span>
                  <p className="text-xs mt-1 opacity-90">Responde para desbloquear</p>
                </button>

                <button
                  onClick={() => {
                    setPendingAction('study')
                    startQuiz()
                  }}
                  className="bg-gradient-to-br from-green-400 to-green-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <span className="font-bold">Estudiar</span>
                  <p className="text-xs mt-1 opacity-90">+10 conocimiento</p>
                </button>
              </div>

              {/* Consejos */}
              <div className="mt-6 bg-amber-100 border-2 border-amber-300 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">💡 Consejo:</p>
                    <p className="text-sm text-amber-800 mt-1">
                      Responde preguntas correctamente para aumentar el conocimiento y felicidad de Don Pippo. ¡Cuídalo bien y subirá de nivel!
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Pantalla de Selección de Acción (después de responder correctamente) */}
          {gameMode === 'select-action' && (
            <div>
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h3 className="text-2xl font-bold text-green-700 mb-2">
                  ¡Respuesta Correcta!
                </h3>
                <p className="text-gray-700 font-semibold">
                  Has desbloqueado UNA acción. ¿Qué quieres hacer?
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md mb-6">
                <img
                  src={mood.image}
                  alt={`Don Pippo - ${mood.text}`}
                  className="w-32 h-32 rounded-full border-4 border-green-300 shadow-xl mx-auto mb-4"
                />
                <p className="text-center text-gray-600 text-sm">
                  ¡Don Pippo espera tu elección! Elige sabiamente 😊
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => executeAction('feed')}
                  className="w-full bg-gradient-to-r from-red-400 to-red-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Apple className="h-10 w-10" />
                    <div className="text-left">
                      <span className="font-bold text-lg block">Alimentar</span>
                      <span className="text-sm opacity-90">+15 hambre, +5 felicidad</span>
                    </div>
                  </div>
                  <span className="text-2xl">🍎</span>
                </button>

                <button
                  onClick={() => executeAction('play')}
                  className="w-full bg-gradient-to-r from-pink-400 to-pink-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="h-10 w-10" />
                    <div className="text-left">
                      <span className="font-bold text-lg block">Jugar</span>
                      <span className="text-sm opacity-90">+12 felicidad, -8 energía</span>
                    </div>
                  </div>
                  <span className="text-2xl">🎉</span>
                </button>

                <button
                  onClick={() => executeAction('rest')}
                  className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="h-10 w-10" />
                    <div className="text-left">
                      <span className="font-bold text-lg block">Dormir</span>
                      <span className="text-sm opacity-90">+20 energía</span>
                    </div>
                  </div>
                  <span className="text-2xl">💤</span>
                </button>
              </div>

              <div className="mt-6 bg-amber-100 border-2 border-amber-300 rounded-xl p-4">
                <p className="text-sm text-amber-900 text-center font-semibold">
                  ⚠️ Solo puedes elegir UNA acción. Elige bien según lo que Don Pippo necesite.
                </p>
              </div>
            </div>
          )}

          {/* Pantalla de Quiz */}
          {gameMode === 'quiz' && currentQuestion && (
            <div>
              <div className="text-center mb-6">
                <img
                  src={mood.image}
                  alt={`Don Pippo - ${mood.text}`}
                  className="w-32 h-32 rounded-full border-4 border-green-300 shadow-xl mx-auto"
                />
                <p className="text-lg font-bold mt-3 text-green-700">
                  ¡Ayúdame a aprender!
                </p>
              </div>

              {!showResult ? (
                <>
                  <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                    <p className="text-xl font-bold text-gray-900 mb-6 text-center">
                      {currentQuestion.question}
                    </p>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => answerQuestion(option)}
                          className="w-full bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-gray-900 p-4 rounded-lg font-semibold transition-all transform hover:scale-105 border-2 border-amber-300"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className={`text-center p-8 rounded-xl ${resultCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className="text-6xl mb-4">
                    {resultCorrect ? '🎉' : '😢'}
                  </div>
                  <p className={`text-2xl font-bold mb-2 ${resultCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {resultCorrect ? '¡Correcto!' : '¡Incorrecto!'}
                  </p>
                  {resultCorrect ? (
                    <p className="text-green-600 font-semibold">
                      ¡Don Pippo está orgulloso! +{currentQuestion.reward.conocimiento} conocimiento
                    </p>
                  ) : (
                    <p className="text-red-600 font-semibold">
                      La respuesta correcta era: {currentQuestion.correct}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DonPippoGame

