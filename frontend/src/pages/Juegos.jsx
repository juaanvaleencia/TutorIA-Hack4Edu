import { useState } from 'react'
import { Gamepad2, Circle, Trophy, Sparkles, Lock, Target } from 'lucide-react'
import Quiz from '../components/games/Quiz'
import Pasapalabra from '../components/games/Pasapalabra'
import AtrapaMillon from '../components/games/AtrapaMillon'
import EscapeRoom from '../components/games/EscapeRoom'
import Ahorcado from '../components/games/Ahorcado'

function Juegos({ student }) {
  const [selectedGame, setSelectedGame] = useState(null)
  const [isDemo, setIsDemo] = useState(false)

  const games = [
    {
      id: 'quiz',
      name: 'Quiz',
      icon: Circle,
      color: 'bg-amber-500',
      colorHover: 'hover:bg-amber-600',
      description: 'Preguntas de opción múltiple',
      component: Quiz,
      hasDemo: false // Quiz ya existía, no hay demo
    },
    {
      id: 'pasapalabra',
      name: 'Pasapalabra',
      icon: Sparkles,
      color: 'bg-orange-500',
      colorHover: 'hover:bg-orange-600',
      description: 'El rosco de palabras',
      component: Pasapalabra,
      hasDemo: true
    },
    {
      id: 'atrapa-millon',
      name: 'Atrapa un Millón',
      icon: Trophy,
      color: 'bg-yellow-500',
      colorHover: 'hover:bg-yellow-600',
      description: 'Escala hasta el millón',
      component: AtrapaMillon,
      hasDemo: true
    },
    {
      id: 'escape-room',
      name: 'Escape Room',
      icon: Lock,
      color: 'bg-amber-600',
      colorHover: 'hover:bg-amber-700',
      description: 'Resuelve enigmas para escapar',
      component: EscapeRoom,
      hasDemo: true
    },
    {
      id: 'ahorcado',
      name: 'Ahorcado',
      icon: Target,
      color: 'bg-orange-600',
      colorHover: 'hover:bg-orange-700',
      description: 'Adivina la palabra educativa',
      component: Ahorcado,
      hasDemo: true
    }
  ]

  const selectedGameData = games.find(g => g.id === selectedGame)

  if (selectedGame && selectedGameData) {
    const GameComponent = selectedGameData.component
    return (
      <div className="min-h-screen bg-gray-50">
        <GameComponent 
          student={student} 
          onBack={() => {
            setSelectedGame(null)
            setIsDemo(false)
          }}
          isDemo={isDemo}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg">
            <Gamepad2 className="h-16 w-16 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Juegos Educativos</h1>
        <p className="text-xl text-gray-600">
          Aprende jugando con estos divertidos juegos interactivos
        </p>
      </div>

      {/* Game Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {games.map((game) => {
          const Icon = game.icon
          return (
            <div
              key={game.id}
              className="card hover:shadow-xl transition-all duration-300"
            >
              <div className="text-center">
                <div className={`${game.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {game.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {game.description}
                </p>
                
                {/* Botones */}
                <div className="space-y-3">
                  {game.hasDemo && (
                    <button
                      onClick={() => {
                        setSelectedGame(game.id)
                        setIsDemo(true)
                      }}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      🎮 Jugar Demo (Sin IA)
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedGame(game.id)
                      setIsDemo(false)
                    }}
                    className={`w-full ${game.color} ${game.colorHover} text-white px-6 py-3 rounded-lg font-semibold transition-colors`}
                  >
                    ✨ Jugar Personalizado
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Section */}
      <div className="mt-16 card max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          ¿Por qué jugar?
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="text-center">
            <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Aprende Jugando</h3>
            <p className="text-sm text-gray-600">
              La mejor manera de retener conocimiento es divirtiéndote
            </p>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Desafía tu Mente</h3>
            <p className="text-sm text-gray-600">
              Pon a prueba tus conocimientos con diferentes formatos
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Mejora Tus Notas</h3>
            <p className="text-sm text-gray-600">
              Practica de forma entretenida y ve tus resultados mejorar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Juegos

