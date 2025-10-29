import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, XCircle, SkipForward, Trophy } from 'lucide-react'
import { generatePasapalabra, generatePasapalabraDemo, completeGame } from '../../services/api'

function Pasapalabra({ student, onBack, isDemo = false }) {
  const [step, setStep] = useState(isDemo ? 'loading-demo' : 'config')
  const [form, setForm] = useState({ subject: '', topic: '' })
  const [game, setGame] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [skipped, setSkipped] = useState(new Set())
  const [showCorrectAnswer, setShowCorrectAnswer] = useState({ word: '', visible: false })
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
      const data = await generatePasapalabraDemo(student.id)
      setGame(data.data)
      setStep('playing')
    } catch (error) {
      alert('Error al cargar el Pasapalabra de demostración')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await generatePasapalabra(student.id, form.subject, form.topic)
      setGame(data.data)
      setStep('playing')
    } catch (error) {
      alert('Error al generar Pasapalabra')
    } finally {
      setLoading(false)
    }
  }

  const currentLetter = game?.letters[currentIndex]

  // Función para normalizar texto (quitar tildes y convertir a minúsculas)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  const checkAnswer = (userAnswer, correctAnswer) => {
    return normalizeText(userAnswer) === normalizeText(correctAnswer)
  }

  const handleAnswer = (correct) => {
    const newAnswers = {...answers}
    newAnswers[currentLetter.letter] = { 
      correct, 
      userAnswer: userInput,
      correctAnswer: currentLetter.answer // Guardar la respuesta correcta
    }
    setAnswers(newAnswers)
    setUserInput('')
    
    // Si es incorrecto, mostrar notificación a la derecha con la respuesta correcta
    if (!correct) {
      setShowCorrectAnswer({ 
        word: currentLetter.answer, 
        visible: true 
      })
      
      // Ocultar después de 2 segundos
      setTimeout(() => {
        setShowCorrectAnswer({ word: '', visible: false })
      }, 2000)
    }
    
    moveToNext()
  }

  const handleSkip = () => {
    const newSkipped = new Set(skipped)
    newSkipped.add(currentIndex)
    setSkipped(newSkipped)
    moveToNext()
  }

  const correct = Object.values(answers).filter(a => a && a.correct).length
  const incorrect = Object.values(answers).filter(a => a && !a.correct).length

  const moveToNext = () => {
    let nextIndex = (currentIndex + 1) % game.letters.length
    let attempts = 0
    while (answers[game.letters[nextIndex].letter] && attempts < game.letters.length) {
      nextIndex = (nextIndex + 1) % game.letters.length
      attempts++
    }
    if (attempts < game.letters.length) {
      setCurrentIndex(nextIndex)
    } else {
      // Juego completado - guardar en progreso y mostrar notificación
      handleGameCompletion()
      setStep('result')
    }
  }

  const handleGameCompletion = async () => {
    if (!game || !game.letters) return
    const totalAnswered = Object.keys(answers).length
    const percentage = totalAnswered > 0 ? (correct / totalAnswered * 100) : 0
    try {
      await completeGame({
        student_id: student.id,
        game_type: 'pasapalabra',
        score: percentage,
        game_data: {
          correct: correct,
          incorrect: incorrect,
          total: game.letters.length,
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

  if (step === 'config') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={onBack} className="btn-secondary mb-6 flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" /> Volver
        </button>
        <div className="card">
          <h2 className="text-3xl font-bold text-orange-600 mb-2 text-center">🔤 Pasapalabra</h2>
          <p className="text-center text-gray-600 mb-6">¡El famoso rosco de palabras!</p>
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Materia</label>
              <input required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="input-field" placeholder="Ej: Historia, Biología..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
              <input required value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} className="input-field" placeholder="Ej: Edad Media, Célula..." />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold">{loading ? 'Generando...' : '¡Comenzar Juego!'}</button>
          </form>
        </div>
      </div>
    )
  }

  if (step === 'playing') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 relative">
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
        
        {/* Notificación de respuesta correcta */}
        {showCorrectAnswer.visible && (
          <div 
            className="fixed top-20 right-4 z-50 transition-all duration-300 ease-in-out"
            style={{
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <div className="bg-red-50 border-4 border-red-500 rounded-xl shadow-2xl p-6 max-w-sm">
              <div className="flex items-start gap-4">
                <div className="bg-red-500 rounded-full p-3">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-red-900 mb-2">❌ Incorrecto</h4>
                  <p className="text-sm text-gray-600 mb-2">La respuesta correcta era:</p>
                  <div className="bg-white rounded-lg p-3 border-2 border-red-300">
                    <p className="text-2xl font-bold text-green-700 text-center">
                      {showCorrectAnswer.word}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Rosco */}
          <div className="md:col-span-2">
            <div className="card bg-orange-50">
              <h3 className="text-xl font-bold text-orange-900 mb-4 text-center">El Rosco</h3>
              <div className="relative mx-auto" style={{ width: '400px', height: '400px' }}>
                {game.letters.map((letter, i) => {
                  const angle = (i * 360) / game.letters.length - 90 // -90 para empezar arriba
                  const radius = 160 // radio del círculo
                  const x = 200 + radius * Math.cos((angle * Math.PI) / 180)
                  const y = 200 + radius * Math.sin((angle * Math.PI) / 180)
                  
                  return (
                    <div
                      key={i}
                      className={`absolute w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                        answers[letter.letter] 
                          ? (answers[letter.letter].correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white') 
                          : i === currentIndex 
                            ? 'bg-orange-500 text-white ring-4 ring-orange-300 scale-110' 
                            : 'bg-white border-3 border-orange-400 text-orange-900'
                      }`}
                      style={{
                        left: `${x - 24}px`,
                        top: `${y - 24}px`,
                        boxShadow: i === currentIndex ? '0 4px 12px rgba(249, 115, 22, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {letter.letter}
                    </div>
                  )
                })}
                
                {/* Centro del rosco */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                  <div className="text-center text-white">
                    <p className="text-4xl font-bold">{correct}</p>
                    <p className="text-xs font-semibold">/ {game.letters.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {currentLetter && !answers[currentLetter.letter] && (
              <div className="card mt-6">
                <div className="bg-orange-100 rounded-lg p-4 mb-4">
                  <span className="text-3xl font-bold text-orange-600">{currentLetter.letter}</span>
                  <p className="text-lg text-gray-900 mt-2">{currentLetter.definition}</p>
                </div>
                <input value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && userInput.trim()) { const isCorrect = checkAnswer(userInput, currentLetter.answer); handleAnswer(isCorrect) } }} className="input-field text-xl text-center mb-4" placeholder="Tu respuesta..." autoFocus />
                <div className="flex gap-3">
                  <button onClick={() => { const isCorrect = checkAnswer(userInput, currentLetter.answer); handleAnswer(isCorrect) }} disabled={!userInput.trim()} className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold">Confirmar</button>
                  <button onClick={handleSkip} className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-900 py-3 rounded-lg font-semibold flex items-center gap-2"><SkipForward className="h-5 w-5" /> Pasar</button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="card bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Correctas</p>
                  <p className="text-3xl font-bold text-green-600">{correct}</p>
                </div>
              </div>
            </div>
            <div className="card bg-red-50">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Incorrectas</p>
                  <p className="text-3xl font-bold text-red-600">{incorrect}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'result') {
    const totalAnswered = Object.keys(answers).length
    const percentage = totalAnswered > 0 ? (correct / totalAnswered * 100).toFixed(1) : 0
    const incorrectAnswers = game.letters.filter(letter => 
      answers[letter.letter] && !answers[letter.letter].correct
    )
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <h2 className="text-3xl font-bold text-orange-600 mb-4">¡Rosco Completado!</h2>
          <div className="text-6xl font-bold text-orange-600 mb-6">{percentage}%</div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Correctas</p>
              <p className="text-3xl font-bold text-green-600">{correct}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Incorrectas</p>
              <p className="text-3xl font-bold text-red-600">{incorrect}</p>
            </div>
          </div>
          
          {/* Mostrar respuestas incorrectas */}
          {incorrectAnswers.length > 0 && (
            <div className="mb-8 text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">📝 Respuestas Incorrectas</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {incorrectAnswers.map((letter) => (
                  <div key={letter.letter} className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {letter.letter}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">{letter.definition}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Tu respuesta:</span>
                            <span className="font-semibold text-red-600">{answers[letter.letter].userAnswer}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Correcta:</span>
                            <span className="font-bold text-green-700">{letter.answer}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            <button onClick={() => { setStep('config'); setGame(null); setAnswers({}); setUserInput('') }} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold">Nuevo Rosco</button>
            <button onClick={onBack} className="flex-1 btn-secondary">Volver a Juegos</button>
          </div>
        </div>
      </div>
    )
  }
}

export default Pasapalabra

