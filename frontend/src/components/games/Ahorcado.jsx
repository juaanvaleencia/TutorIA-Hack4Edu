import { useState, useEffect } from 'react'
import { generateAhorcado, generateAhorcadoDemo, completeGame } from '../../services/api'
import { Loader, Heart, Trophy, Lightbulb, ArrowLeft } from 'lucide-react'

function Ahorcado({ student, onBack, isDemo = false }) {
  const [step, setStep] = useState(isDemo ? 'loading-demo' : 'config')
  const [form, setForm] = useState({ subject: '', topic: '' })
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [guessedLetters, setGuessedLetters] = useState([])
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [lives, setLives] = useState(6)
  const [gameWon, setGameWon] = useState(false)
  const [gameLost, setGameLost] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [wordsCompleted, setWordsCompleted] = useState(0)
  const [showCompletionNotification, setShowCompletionNotification] = useState(false)
  const [allWordsCompleted, setAllWordsCompleted] = useState(false)

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  useEffect(() => {
    const loadDemoGame = async () => {
      setLoading(true)
      try {
        const response = await generateAhorcadoDemo(student.id)
        if (response && response.data) {
          setGameData(response.data)
          setStep('playing')
        }
      } catch (error) {
        console.error('Error cargando ahorcado demo:', error)
        alert('Error al cargar el Ahorcado de demostración')
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
      const response = await generateAhorcado(student.id, form.subject, form.topic)
      setGameData(response.data)
      setStep('playing')
    } catch (error) {
      console.error('Error generando ahorcado:', error)
      alert('Error al generar el ahorcado. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleLetterClick = (letter) => {
    if (guessedLetters.includes(letter) || gameWon || gameLost) return

    const newGuessedLetters = [...guessedLetters, letter]
    setGuessedLetters(newGuessedLetters)

    const currentWord = gameData.words[currentWordIndex]
    
    if (!currentWord.word.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1
      setWrongGuesses(newWrongGuesses)
      
      if (newWrongGuesses >= 6) {
        setGameLost(true)
        setShowHint(true)
      }
    } else {
      // Check if word is complete
      const allLettersGuessed = currentWord.word.split('').every(l => 
        newGuessedLetters.includes(l)
      )
      
      if (allLettersGuessed) {
        setGameWon(true)
      }
    }
  }

  const handleGameCompletion = async () => {
    const totalWords = gameData?.words?.length || 1
    const percentage = (wordsCompleted / totalWords) * 100
    try {
      await completeGame({
        student_id: student.id,
        game_type: 'ahorcado',
        score: percentage,
        game_data: {
          words_completed: wordsCompleted,
          total_words: totalWords,
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

  const handleNextWord = () => {
    const totalWords = gameData?.words?.length || 0
    if (currentWordIndex < totalWords - 1) {
      const newWordsCompleted = wordsCompleted + 1
      setWordsCompleted(newWordsCompleted)
      setCurrentWordIndex(currentWordIndex + 1)
      setGuessedLetters([])
      setWrongGuesses(0)
      setGameWon(false)
      setGameLost(false)
      setShowHint(false)
      
      // Si es la última palabra, juego completado
      if (currentWordIndex === totalWords - 2) {
        setTimeout(() => {
          setWordsCompleted(newWordsCompleted + 1)
          setAllWordsCompleted(true)
          handleGameCompletion()
        }, 500)
      }
    } else {
      const newWordsCompleted = wordsCompleted + 1
      setWordsCompleted(newWordsCompleted)
      setAllWordsCompleted(true)
      handleGameCompletion()
    }
  }

  const handleReset = () => {
    setGameData(null)
    setStep(isDemo ? 'loading-demo' : 'config')
    setCurrentWordIndex(0)
    setGuessedLetters([])
    setWrongGuesses(0)
    setLives(6)
    setGameWon(false)
    setGameLost(false)
    setShowHint(false)
    setWordsCompleted(0)
  }

  const renderWord = () => {
    if (!gameData || !gameData.words[currentWordIndex]) return null
    const word = gameData.words[currentWordIndex].word
    
    return word.split('').map((letter, index) => (
      <div
        key={index}
        className="w-12 h-16 border-b-4 border-gray-400 flex items-center justify-center text-3xl font-bold text-gray-800"
      >
        {guessedLetters.includes(letter) || gameLost ? letter : ''}
      </div>
    ))
  }

  const getHangmanStages = () => {
    const stages = [
      // Base
      <line key="base" x1="20" y1="180" x2="100" y2="180" stroke="black" strokeWidth="3" />,
      // Pole
      <line key="pole" x1="40" y1="180" x2="40" y2="20" stroke="black" strokeWidth="3" />,
      // Top
      <line key="top" x1="40" y1="20" x2="100" y2="20" stroke="black" strokeWidth="3" />,
      // Rope
      <line key="rope" x1="100" y1="20" x2="100" y2="40" stroke="black" strokeWidth="3" />,
      // Head
      <circle key="head" cx="100" cy="55" r="15" stroke="black" strokeWidth="3" fill="none" />,
      // Body + Arms + Legs combined
      <g key="body">
        <line x1="100" y1="70" x2="100" y2="120" stroke="black" strokeWidth="3" />
        <line x1="100" y1="80" x2="80" y2="100" stroke="black" strokeWidth="3" />
        <line x1="100" y1="80" x2="120" y2="100" stroke="black" strokeWidth="3" />
        <line x1="100" y1="120" x2="80" y2="150" stroke="black" strokeWidth="3" />
        <line x1="100" y1="120" x2="120" y2="150" stroke="black" strokeWidth="3" />
      </g>
    ]

    return stages.slice(0, Math.min(wrongGuesses + 1, 6))
  }

  if (loading || step === 'loading-demo') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader className="h-12 w-12 animate-spin text-primary-600" />
        <p className="text-lg text-gray-600">
          {step === 'loading-demo' ? 'Cargando demo...' : 'Generando tu Ahorcado Educativo...'}
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
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Ahorcado Educativo
            </h2>
            <p className="text-gray-600">
              ¡Adivina las palabras letra por letra! Cada palabra está relacionada con tu tema de estudio.
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
              🔥 Generar Ahorcado
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!gameData || !gameData.words) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-lg text-gray-600">Error: No se pudo cargar el juego</p>
        <button onClick={onBack} className="btn-secondary">
          Volver a Juegos
        </button>
      </div>
    )
  }

  if (wordsCompleted === gameData.words.length || allWordsCompleted) {
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
            🎉 ¡JUEGO COMPLETADO!
          </h2>
          <p className="text-xl text-gray-700 mb-6">
            ¡Felicidades! Has adivinado todas las palabras
          </p>
          
          <div className="bg-white p-6 rounded-lg mb-6">
            <p className="text-lg font-semibold text-gray-800 mb-2">
              Estadísticas:
            </p>
            <p className="text-gray-600">
              ✅ Palabras completadas: {wordsCompleted} / {gameData.words.length}
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

  const currentWord = gameData.words[currentWordIndex]

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
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-t-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">🎯 Ahorcado Educativo</h2>
        
        {/* Progress and Lives */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-100">Palabra {currentWordIndex + 1} de {gameData.words.length}</p>
            <p className="text-xs text-orange-100">Completadas: {wordsCompleted}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Vidas:</span>
            {[...Array(lives)].map((_, i) => (
              <Heart
                key={i}
                className={`h-6 w-6 ${
                  i < lives - wrongGuesses ? 'fill-red-200 text-red-200' : 'text-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="bg-white rounded-b-2xl shadow-lg p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Hangman Drawing */}
          <div className="flex flex-col items-center">
            <svg width="200" height="200" className="border-2 border-gray-300 rounded-lg bg-gray-50">
              {getHangmanStages()}
            </svg>
            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-gray-700">
                Categoría: <span className="text-red-600">{currentWord.category}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Dificultad: <span className="capitalize">{currentWord.difficulty}</span>
              </p>
            </div>
          </div>

          {/* Word Display */}
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {renderWord()}
            </div>

            {/* Hint Button */}
            {!showHint && !gameLost && !gameWon && (
              <button
                onClick={() => setShowHint(true)}
                className="btn-secondary mb-4 flex items-center justify-center gap-2"
              >
                <Lightbulb className="h-5 w-5" />
                Ver Pista
              </button>
            )}

            {/* Hint Display */}
            {showHint && (
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="font-semibold text-yellow-800 mb-1">Pista:</p>
                <p className="text-yellow-700">{currentWord.hint}</p>
              </div>
            )}

            {/* Win/Loss Messages */}
            {gameWon && (
              <div className="mb-4 bg-green-100 p-4 rounded-lg text-center">
                <p className="font-bold text-green-700 text-xl mb-2">🎉 ¡Correcto!</p>
                <p className="text-green-600 mb-4">{currentWord.hint}</p>
                <button
                  onClick={handleNextWord}
                  className="btn-primary"
                >
                  {currentWordIndex < gameData.words.length - 1 ? 'Siguiente Palabra →' : 'Finalizar'}
                </button>
              </div>
            )}

            {gameLost && (
              <div className="mb-4 bg-red-100 p-4 rounded-lg text-center">
                <p className="font-bold text-red-700 text-xl mb-2">😔 Perdiste</p>
                <p className="text-red-600 mb-2">La palabra era: <span className="font-bold">{currentWord.word}</span></p>
                <p className="text-red-600 mb-4">{currentWord.hint}</p>
                <button
                  onClick={handleNextWord}
                  className="btn-primary"
                >
                  {currentWordIndex < gameData.words.length - 1 ? 'Siguiente Palabra →' : 'Ver Resultados'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Keyboard */}
        {!gameWon && !gameLost && (
          <div className="mt-8">
            <h3 className="text-center font-semibold text-gray-700 mb-4">Selecciona una letra:</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {alphabet.map((letter) => {
                const isGuessed = guessedLetters.includes(letter)
                const isCorrect = isGuessed && currentWord.word.includes(letter)
                const isWrong = isGuessed && !currentWord.word.includes(letter)

                return (
                  <button
                    key={letter}
                    onClick={() => handleLetterClick(letter)}
                    disabled={isGuessed}
                    className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
                      isCorrect
                        ? 'bg-green-500 text-white'
                        : isWrong
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    } ${isGuessed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Ahorcado
