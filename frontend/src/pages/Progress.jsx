import { useState, useEffect } from 'react'
import { getStudentStats } from '../services/api'
import { TrendingUp, MessageCircle, Trophy, BookOpen, Calendar } from 'lucide-react'

function Progress({ student }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [student])

  const loadStats = async () => {
    try {
      const data = await getStudentStats(student.id)
      setStats(data)
      setError(null)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      setError('No se pudieron cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido a tu Panel de Progreso</h2>
          <p className="text-gray-600 mb-6">
            Aquí podrás ver tus estadísticas cuando empieces a usar TutorIA
          </p>
          <div className="text-left max-w-md mx-auto bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
            <h3 className="font-bold text-amber-900 mb-3">💡 Para ver tu progreso:</h3>
            <ul className="space-y-2 text-amber-800">
              <li>• Chatea con Don Pippo en la sección Chat</li>
              <li>• Completa quizzes y juegos</li>
              <li>• Crea tarjetas de estudio</li>
              <li>• Sube documentos en "Mis Temas"</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tu Progreso</h1>
        <p className="text-gray-600">Revisa tu evolución y estadísticas de aprendizaje</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats.total_questions}
          </p>
          <p className="text-sm text-gray-600">Preguntas Realizadas</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats.quizzes_completed}
          </p>
          <p className="text-sm text-gray-600">Quizzes Completados</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats.games_completed || 0}
          </p>
          <p className="text-sm text-gray-600">Juegos Completados</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats.study_cards_created}
          </p>
          <p className="text-sm text-gray-600">Tarjetas Creadas</p>
        </div>
      </div>

      {/* Games Breakdown */}
      {stats.games_by_type && (stats.games_completed || 0) > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎮 Desglose de Juegos</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600 mb-1">
                {stats.games_by_type.pasapalabra || 0}
              </p>
              <p className="text-sm text-gray-600">🔤 Pasapalabra</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600 mb-1">
                {stats.games_by_type['atrapa-millon'] || 0}
              </p>
              <p className="text-sm text-gray-600">💰 Atrapa un Millón</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600 mb-1">
                {stats.games_by_type['escape-room'] || 0}
              </p>
              <p className="text-sm text-gray-600">🔒 Escape Room</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600 mb-1">
                {stats.games_by_type.ahorcado || 0}
              </p>
              <p className="text-sm text-gray-600">🎯 Ahorcado</p>
            </div>
          </div>
        </div>
      )}

      {/* Student Info */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Estudiante</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Nombre</p>
            <p className="font-semibold text-gray-900">{stats.student_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Nivel Educativo</p>
            <p className="font-semibold text-gray-900 capitalize">{stats.education_level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Conversaciones</p>
            <p className="font-semibold text-gray-900">{stats.total_conversations}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Miembro desde</p>
            <p className="font-semibold text-gray-900">
              {new Date(stats.member_since).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Logros</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {stats.total_questions >= 10 && (
            <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Curioso</p>
                <p className="text-xs text-gray-600">10+ preguntas</p>
              </div>
            </div>
          )}

          {stats.quizzes_completed >= 5 && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Practicante</p>
                <p className="text-xs text-gray-600">5+ quizzes</p>
              </div>
            </div>
          )}

          {stats.average_quiz_score >= 70 && stats.quizzes_completed >= 3 && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Destacado</p>
                <p className="text-xs text-gray-600">70%+ promedio</p>
              </div>
            </div>
          )}

          {stats.total_questions === 0 && stats.quizzes_completed === 0 && (
            <div className="col-span-3 text-center py-8 text-gray-500">
              Sigue aprendiendo para desbloquear logros 🎯
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Progress

