import { useState, useEffect } from 'react'
import { ArrowLeft, Trophy, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { generateAtrapaMillon, generateAtrapaMillonDemo, completeGame } from '../../services/api'

function AtrapaMillon({ student, onBack, isDemo = false }) {
  const [step, setStep] = useState(isDemo ? 'loading-demo' : 'config')
  const [form, setForm] = useState({ subject: '', topic: '' })
  const [game, setGame] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [loading, setLoading] = useState(false)
  const [points, setPoints] = useState(1000000) // Puntos iniciales
  const [bets, setBets] = useState([0, 0, 0, 0]) // Apuestas en cada opción (A, B, C, D)
  const [showResult, setShowResult] = useState(false) // Mostrar resultado de la pregunta
  const [showCompletionNotification, setShowCompletionNotification] = useState(false)

  // Cargar demo automáticamente si isDemo es true
  useEffect(() => {
    if (isDemo && step === 'loading-demo') {
      loadDemo()
    }
  }, [isDemo, step])

  const loadDemo = async () => {
    setLoading(true)
    try {
      const data = await generateAtrapaMillonDemo(student.id)
      setGame(data.data)
      setStep('playing')
    } catch (error) {
      alert('Error al cargar Atrapa un Millón de demostración')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await generateAtrapaMillon(student.id, form.subject, form.topic)
      setGame(data.data)
      setStep('playing')
    } catch (error) {
      alert('Error al generar Atrapa un Millón')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBets = () => {
    const totalBet = bets.reduce((sum, bet) => sum + bet, 0)
    if (totalBet !== points) {
      alert(`Debes apostar TODOS tus puntos (${formatPoints(points)}). Actualmente has apostado ${formatPoints(totalBet)}.`)
      return
    }
    setShowResult(true)
  }

  const handleNextQuestion = () => {
    const question = game.questions[currentQuestion]
    const correctAnswer = question.correct_answer
    const pointsWon = bets[correctAnswer]
    
    setPoints(pointsWon)
    
    if (currentQuestion === 9 || pointsWon === 0) {
      // Terminó el juego - guardar en progreso
      handleGameCompletion()
      setStep('result')
    } else {
      // Siguiente pregunta
      setCurrentQuestion(currentQuestion + 1)
      setBets([0, 0, 0, 0])
      setShowResult(false)
    }
  }

  const handlePlantarse = () => {
    handleGameCompletion()
    setStep('result')
  }

  const handleGameCompletion = async () => {
    const percentage = (points / 1000000) * 100
    try {
      await completeGame({
        student_id: student.id,
        game_type: 'atrapa-millon',
        score: percentage,
        game_data: {
          final_points: points,
          questions_answered: currentQuestion + 1,
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

  const formatPoints = (pts) => {
    return new Intl.NumberFormat('es-ES').format(pts)
  }

  const updateBet = (index, value) => {
    const newBets = [...bets]
    const numValue = parseInt(value) || 0
    newBets[index] = Math.max(0, Math.min(numValue, points))
    setBets(newBets)
  }

  const distributeEqually = () => {
    const perOption = Math.floor(points / 4)
    const remainder = points % 4
    const newBets = [perOption, perOption, perOption, perOption]
    newBets[0] += remainder // El resto va a la primera opción
    setBets(newBets)
  }

  const clearBets = () => {
    setBets([0, 0, 0, 0])
  }

  const totalBet = bets.reduce((sum, bet) => sum + bet, 0)
  const remainingPoints = points - totalBet

  if (step === 'config') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={onBack} className="btn-secondary mb-6 flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" /> Volver
        </button>
        <div className="card">
          <h2 className="text-3xl font-bold text-green-600 mb-2 text-center">💰 Atrapa un Millón</h2>
          <p className="text-center text-gray-600 mb-6">Responde correctamente y llega al millón</p>
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Materia</label>
              <input required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="input-field" placeholder="Ej: Geografía, Literatura..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
              <input required value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} className="input-field" placeholder="Ej: Capitales del mundo, Shakespeare..." />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">{loading ? 'Generando...' : '¡Comenzar Juego!'}</button>
          </form>
        </div>
      </div>
    )
  }

  if (step === 'playing') {
    const question = game.questions[currentQuestion]
    const correctAnswer = question.correct_answer
    
    return (
      <div className="w-full px-4 md:px-8 py-4 relative" style={{ maxHeight: '100vh', overflow: 'auto' }}>
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
        
        {/* Header con puntos actuales estilo TV - Reducido */}
        <div className="relative mb-3">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden">
            {/* Efectos de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-pulse"></div>
            
            <div className="relative px-6 py-4">
              <div className="flex justify-between items-center">
                {/* Puntos disponibles */}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">💰 Tus Puntos</p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 inline-block">
                    <p className="text-3xl font-black text-white drop-shadow-lg">{formatPoints(points)}</p>
                  </div>
                </div>
                
                {/* Pregunta actual */}
                <div className="flex-1 text-right">
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">📊 Pregunta</p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 inline-block">
                    <p className="text-3xl font-black text-white drop-shadow-lg">{currentQuestion + 1}<span className="text-xl text-white/70">/10</span></p>
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso de apuestas */}
              {!showResult && (
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">Apostado: {formatPoints(totalBet)}</span>
                    <span className={`text-sm font-black ${remainingPoints === 0 ? 'text-green-300' : 'text-yellow-300'}`}>
                      {remainingPoints === 0 ? '✅ Completo' : `⚠️ Faltan: ${formatPoints(remainingPoints)}`}
                    </span>
                  </div>
                  {/* Barra de progreso */}
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        remainingPoints === 0 ? 'bg-green-400' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${(totalBet / points) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pregunta - Reducida y ocupando ancho completo */}
        <div className="card mb-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <div className="text-center py-3">
            <h2 className="text-lg md:text-xl font-bold mb-1">{question.question}</h2>
            <p className="text-xs md:text-sm opacity-90">
              💡 Distribuye tus puntos entre las opciones
            </p>
          </div>
        </div>

        {!showResult ? (
          <>
            {/* Panel de apuestas estilo juego de mesa - Full width sin scroll vertical */}
            <div className="relative mx-auto mb-2" style={{ width: '100%' }}>
              {/* Tablero curvo con las 4 opciones - altura relativa a viewport */}
              <div className="relative" style={{ height: '44vh', overflow: 'visible' }}>
                {question.options.map((opt, i) => {
                  // Posiciones en arco centradas horizontalmente
                  const positions = [
                    { left: '20%', top: '50%', rotate: '-12deg' },
                    { left: '40%', top: '15%', rotate: '-4deg' },
                    { left: '60%', top: '15%', rotate: '4deg' },
                    { left: '80%', top: '50%', rotate: '12deg' }
                  ]
                  const pos = positions[i]
                  
                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        left: pos.left,
                        top: pos.top,
                        transform: `translate(-50%, -50%) rotate(${pos.rotate}) scale(0.85)`,
                        width: 'clamp(140px, 16vw, 220px)'
                      }}
                    >
                      {/* Carta de opción estilo juego de mesa - Reducida */}
                      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-xl p-1 transform hover:scale-105 transition-all">
                        <div className="bg-white rounded-lg p-3">
                          {/* Letra de la opción */}
                          <div className="text-center mb-2">
                            <div className="inline-block bg-gradient-to-br from-red-500 to-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-2xl font-bold">{String.fromCharCode(65 + i)}</span>
                            </div>
                          </div>
                          
                          {/* Texto de la opción */}
                          <p className="text-center text-xs font-semibold text-gray-800 mb-2 min-h-[32px] flex items-center justify-center">
                            {opt}
                          </p>
                          
                          {/* Input de apuesta */}
                          <div className="bg-gray-100 rounded-lg p-1.5">
                            <p className="text-xs text-gray-600 text-center mb-1">Apostar:</p>
                            <input
                              type="number"
                              min="0"
                              max={points}
                              value={bets[i]}
                              onChange={(e) => updateBet(i, e.target.value)}
                              className="w-full text-center font-bold text-sm border-2 border-gray-300 rounded-lg py-1.5 focus:border-red-500 focus:outline-none"
                              placeholder="0"
                            />
                            <p className="text-center text-xs font-bold text-red-600 mt-0.5">
                              {formatPoints(bets[i])}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {/* Línea de arco decorativa */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                  <path
                    d="M 100 350 Q 250 100, 450 150 T 800 350"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="10,5"
                  />
                </svg>
              </div>
            </div>

            {/* Botones de ayuda estilo juego - Reducidos (encima de Confirmar/Retirarse) */}
            <div className="flex gap-3 mt-2 mb-3 justify-center">
              <button
                onClick={distributeEqually}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 py-2 px-4 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all text-sm"
              >
                ⚖️ Distribuir Equitativamente
              </button>
              <button
                onClick={clearBets}
                className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white py-2 px-4 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all text-sm"
              >
                🗑️ Limpiar Apuestas
              </button>
            </div>

            {/* Botón principal estilo juego - Debajo de los de ayuda */}
            <div className="flex gap-3 justify-center mb-2">
              <button
                onClick={handleConfirmBets}
                disabled={totalBet !== points}
                className={`py-3 px-6 rounded-xl font-bold text-lg shadow-xl transform transition-all ${
                  totalBet !== points
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white hover:scale-105'
                }`}
              >
                {totalBet !== points 
                  ? `⚠️ Faltan ${formatPoints(remainingPoints)}`
                  : '✅ CONFIRMAR DISTRIBUCIÓN'
                }
              </button>
              <button
                onClick={handlePlantarse}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all"
              >
                🚪 Retirarse
              </button>
            </div>
          </>
        ) : (
          /* Mostrar resultado - Reducido */
          <div className="space-y-4">
            {/* Opciones con resultados en arco - Full width */}
            <div className="relative mx-auto mb-2" style={{ width: '100%' }}>
              <div className="relative" style={{ height: '44vh', overflow: 'visible' }}>
                {question.options.map((opt, i) => {
                  const positions = [
                    { left: '20%', top: '50%', rotate: '-12deg' },
                    { left: '40%', top: '15%', rotate: '-4deg' },
                    { left: '60%', top: '15%', rotate: '4deg' },
                    { left: '80%', top: '50%', rotate: '12deg' }
                  ]
                  const pos = positions[i]
                  const isCorrect = i === correctAnswer
                  const hasbet = bets[i] > 0
                  
                  return (
                    <div
                      key={i}
                      className="absolute animate-pulse"
                      style={{
                        left: pos.left,
                        top: pos.top,
                        transform: `translate(-50%, -50%) rotate(${pos.rotate}) scale(0.85)`,
                        width: 'clamp(140px, 16vw, 220px)',
                        animation: isCorrect ? 'pulse 1s infinite' : 'none'
                      }}
                    >
                      {/* Carta de resultado - Reducida */}
                      <div className={`rounded-xl shadow-xl p-1 transform transition-all ${
                        isCorrect 
                          ? 'bg-gradient-to-br from-green-400 to-green-600 scale-110' 
                          : hasbet 
                            ? 'bg-gradient-to-br from-red-400 to-red-600'
                            : 'bg-gradient-to-br from-gray-300 to-gray-400'
                      }`}>
                        <div className="bg-white rounded-lg p-3">
                          {/* Letra de la opción */}
                          <div className="text-center mb-2">
                            <div className={`inline-block w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                              isCorrect 
                                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' 
                                : hasbet
                                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                                  : 'bg-gray-300 text-gray-600'
                            }`}>
                              <span className="text-2xl font-bold">{String.fromCharCode(65 + i)}</span>
                            </div>
                          </div>
                          
                          {/* Estado */}
                          {isCorrect && (
                            <div className="text-center mb-1">
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                ✅ CORRECTA
                              </span>
                            </div>
                          )}
                          
                          {/* Texto de la opción */}
                          <p className="text-center text-xs font-semibold text-gray-800 mb-2 min-h-[32px] flex items-center justify-center">
                            {opt}
                          </p>
                          
                          {/* Resultado de apuesta */}
                          <div className={`rounded-lg p-2 ${
                            isCorrect 
                              ? 'bg-green-50' 
                              : hasbet 
                                ? 'bg-red-50'
                                : 'bg-gray-50'
                          }`}>
                            <p className="text-xs text-gray-600 text-center mb-0.5">Apostaste:</p>
                            <p className={`text-lg font-bold text-center ${
                              isCorrect 
                                ? 'text-green-600' 
                                : hasbet 
                                  ? 'text-red-600'
                                  : 'text-gray-400'
                            }`}>
                              {formatPoints(bets[i])}
                            </p>
                            {isCorrect && hasbet && (
                              <p className="text-xs text-green-700 font-bold text-center mt-0.5">
                                ¡Conservados! 🎉
                              </p>
                            )}
                            {!isCorrect && hasbet && (
                              <p className="text-xs text-red-700 font-bold text-center mt-0.5">
                                Perdidos ❌
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Resumen estilo TV - Reducido */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-white/10 backdrop-blur-sm p-4 text-center">
                <p className="text-base font-bold text-white/90 mb-2">
                  {bets[correctAnswer] === 0 ? '💔 GAME OVER' : '🎯 Próxima Ronda'}
                </p>
                <div className="bg-white rounded-xl px-5 py-3 inline-block mb-2">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">Puntos para continuar</p>
                  <p className={`text-3xl font-black ${
                    bets[correctAnswer] === 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatPoints(bets[correctAnswer])}
                  </p>
                </div>
                {bets[correctAnswer] === 0 && (
                  <p className="text-white font-bold text-sm bg-red-500/50 rounded-lg px-3 py-1.5 inline-block">
                    ❌ No apostaste en la respuesta correcta
                  </p>
                )}
                {bets[correctAnswer] > 0 && (
                  <p className="text-white font-bold text-sm bg-green-500/50 rounded-lg px-3 py-1.5 inline-block">
                    ✅ ¡Continúas en el juego!
                  </p>
                )}
              </div>
            </div>

            {/* Botón continuar estilo TV - Reducido */}
            <button
              onClick={handleNextQuestion}
              className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-black text-base md:text-lg shadow-xl transform hover:scale-105 transition-all uppercase tracking-wider"
            >
              {bets[correctAnswer] === 0 
                ? '📊 Ver Resultados Finales' 
                : currentQuestion === 9 
                  ? '🏆 Ver Resultados Finales' 
                  : '➡️ Siguiente Pregunta'}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (step === 'result') {
    const percentage = ((points / 1000000) * 100).toFixed(1)
    const completedAll = currentQuestion === 10
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center">
          {completedAll ? (
            <>
              <Trophy className="h-24 w-24 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-green-600 mb-4">¡COMPLETASTE LAS 10 PREGUNTAS!</h2>
            </>
          ) : (
            <>
              <DollarSign className="h-24 w-24 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Fin del Juego!</h2>
            </>
          )}
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 mb-6">
            <p className="text-sm text-gray-600 mb-2">Puntos finales</p>
            <p className="text-6xl font-bold text-green-600">{formatPoints(points)}</p>
            <p className="text-lg text-gray-500 mt-2">{percentage}% del millón inicial</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Preguntas respondidas</p>
              <p className="text-3xl font-bold text-blue-600">{currentQuestion} / 10</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Conservaste</p>
              <p className="text-3xl font-bold text-purple-600">{percentage}%</p>
            </div>
          </div>

          {points >= 500000 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-semibold">
                🎉 ¡Excelente! Conservaste más de la mitad del millón
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setStep('config')
                setGame(null)
                setCurrentQuestion(0)
                setPoints(1000000)
                setBets([0, 0, 0, 0])
                setShowResult(false)
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
            >
              Nuevo Juego
            </button>
            <button onClick={onBack} className="flex-1 btn-secondary">
              Volver a Juegos
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default AtrapaMillon

