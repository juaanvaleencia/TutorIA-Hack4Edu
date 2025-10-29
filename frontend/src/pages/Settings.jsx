import { useState, useEffect } from 'react'
import { User, Mail, GraduationCap, LogOut, Star, Zap, Heart, Apple, BookOpen, Trophy, MessageCircle, TrendingUp } from 'lucide-react'
import { getStudentStats } from '../services/api'

function Settings({ student, setStudent }) {
  const [editMode, setEditMode] = useState(false)
  const [pippoStats, setPippoStats] = useState(null)
  const [studentStats, setStudentStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Cargar stats de Don Pippo
  useEffect(() => {
    const saved = localStorage.getItem('donPippoStats')
    if (saved) {
      setPippoStats(JSON.parse(saved))
    } else {
      // Stats por defecto si no existe
      setPippoStats({
        hambre: 80,
        energia: 75,
        felicidad: 85,
        conocimiento: 60,
        nivel: 1,
        experiencia: 0
      })
    }
  }, [])

  // Cargar estadísticas del estudiante
  useEffect(() => {
    const loadStudentStats = async () => {
      try {
        setLoadingStats(true)
        const data = await getStudentStats(student.id)
        setStudentStats(data)
      } catch (error) {
        console.error('Error cargando estadísticas:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    if (student && student.id) {
      loadStudentStats()
    }
  }, [student])

  const handleLogout = () => {
    localStorage.removeItem('student')
    setStudent(null)
    window.location.href = '/'
  }

  const educationLevels = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'bachillerato', label: 'Bachillerato' },
    { value: 'universidad', label: 'Universidad' }
  ]

  // Obtener estado/ánimo de Don Pippo
  const getPippoMood = () => {
    if (!pippoStats) return { image: '/don-pippo-contento.gif' }
    
    const stats = [pippoStats.hambre, pippoStats.energia, pippoStats.felicidad, pippoStats.conocimiento]
    
    const redCount = stats.filter(s => s < 33).length
    const yellowCount = stats.filter(s => s >= 33 && s < 66).length
    const greenCount = stats.filter(s => s >= 66).length
    
    if (greenCount === 4) {
      return { image: '/don-pippo-contento.gif' }
    }
    
    if (redCount >= 1 && yellowCount >= 1) {
      return { image: '/don-pippo-enfadado.gif' }
    }
    
    if (yellowCount >= 2) {
      return { image: '/don-pippo-triste.gif' }
    }
    
    if (redCount >= 2) {
      return { image: '/don-pippo-enfadado.gif' }
    }
    
    return { image: '/don-pippo-triste.gif' }
  }

  const mood = getPippoMood()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Administra tu perfil y preferencias</p>
      </div>

      {/* Profile Info */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Información Personal</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Nombre</p>
              <p className="font-semibold text-gray-900">{student.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold text-gray-900">{student.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Nivel Educativo</p>
              <p className="font-semibold text-gray-900 capitalize">{student.education_level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Progress Stats */}
      {studentStats && !loadingStats && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tu Progreso</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <MessageCircle className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {studentStats.total_questions || 0}
              </p>
              <p className="text-xs text-gray-600">Preguntas</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {studentStats.quizzes_completed || 0}
              </p>
              <p className="text-xs text-gray-600">Quizzes</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {studentStats.study_cards_created || 0}
              </p>
              <p className="text-xs text-gray-600">Tarjetas</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {studentStats.games_completed || 0}
              </p>
              <p className="text-xs text-gray-600">Juegos</p>
            </div>
          </div>

          {studentStats.average_quiz_score !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                📊 Promedio en Quizzes: <span className="font-bold text-orange-600">{studentStats.average_quiz_score.toFixed(1)}%</span>
              </p>
            </div>
          )}

          {studentStats.total_conversations !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                💬 {studentStats.total_conversations || 0} conversaciones con Don Pippo
              </p>
            </div>
          )}
        </div>
      )}

      {/* Don Pippo Stats */}
      {pippoStats && (
        <div className="card mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={mood.image}
              alt="Don Pippo"
              className="w-20 h-20 rounded-full border-4 border-amber-300 shadow-lg"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                🏛️ Don Pippo
              </h2>
              <p className="text-gray-600">Tu compañero de aprendizaje</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 shadow-md border-2 border-amber-300">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-yellow-600" />
                <span className="font-bold text-gray-900">Nivel</span>
              </div>
              <p className="text-3xl font-black text-amber-600">{pippoStats.nivel}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-2 border-amber-300">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-6 w-6 text-amber-600" />
                <span className="font-bold text-gray-900">Experiencia</span>
              </div>
              <p className="text-2xl font-black text-orange-600">{pippoStats.experiencia} XP</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all"
                  style={{ width: `${(pippoStats.experiencia % 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {100 - (pippoStats.experiencia % 100)} XP para nivel {pippoStats.nivel + 1}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Apple className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold text-gray-700">Hambre</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${pippoStats.hambre}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{pippoStats.hambre}%</p>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-700">Energía</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${pippoStats.energia}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{pippoStats.energia}%</p>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-semibold text-gray-700">Felicidad</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full"
                  style={{ width: `${pippoStats.felicidad}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{pippoStats.felicidad}%</p>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">Conocimiento</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${pippoStats.conocimiento}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{pippoStats.conocimiento}%</p>
            </div>
          </div>

          <div className="mt-4 bg-amber-100 border-2 border-amber-300 rounded-lg p-3">
            <p className="text-sm text-amber-900 text-center font-medium">
              💡 Cuida a Don Pippo en el Chat para subir de nivel
            </p>
          </div>
        </div>
      )}

      {/* Subjects of Interest */}
      {student.subjects_of_interest && student.subjects_of_interest.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Materias de Interés</h2>
          <div className="flex flex-wrap gap-2">
            {student.subjects_of_interest.map(subject => (
              <span
                key={subject}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* About TutorIA */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acerca de TutorIA</h2>
        <p className="text-gray-600 mb-4">
          TutorIA es tu asistente de aprendizaje personal impulsado por inteligencia artificial.
          Está diseñado para ayudarte a comprender cualquier tema, resolver ejercicios y mejorar
          tu rendimiento académico.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-900">Versión</p>
            <p className="text-gray-600">1.0.0</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Modelo IA</p>
            <p className="text-gray-600">GPT-4</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones</h2>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}

export default Settings


