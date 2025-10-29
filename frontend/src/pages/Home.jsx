import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { register, login } from '../services/api'
import { GraduationCap, BookOpen, Camera, BarChart, Sparkles, LogIn, UserPlus, Users, UserCheck } from 'lucide-react'

function Home({ student, setStudent }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' o 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',  // 'student' o 'teacher'
    education_level: 'secundaria',
    subjects_of_interest: [],
    class_code: ''  // Código de clase (solo para estudiantes)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Redirigir si ya está logueado
  useEffect(() => {
    if (student) {
      if (student.role === 'teacher') {
        navigate('/teacher-dashboard')
      } else {
        navigate('/chat')
      }
    }
  }, [student, navigate])

  const educationLevels = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'bachillerato', label: 'Bachillerato' },
    { value: 'universidad', label: 'Universidad' }
  ]

  const subjects = [
    'Matemáticas', 'Física', 'Química', 'Biología',
    'Historia', 'Literatura', 'Inglés', 'Programación'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let studentData
      
      if (mode === 'login') {
        // Iniciar sesión
        studentData = await login({
          email: formData.email,
          password: formData.password
        })
      } else {
        // Registrarse
        studentData = await register(formData)
      }
      
      setStudent(studentData)
      
      // Redirigir según el rol
      if (studentData.role === 'teacher') {
        navigate('/teacher-dashboard')
      } else {
        navigate('/chat')
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Error al ${mode === 'login' ? 'iniciar sesión' : 'registrarse'}`)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    // Limpiar solo los campos sensibles
    setFormData(prev => ({
      ...prev,
      password: ''
    }))
  }

  const toggleSubject = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects_of_interest: prev.subjects_of_interest.includes(subject)
        ? prev.subjects_of_interest.filter(s => s !== subject)
        : [...prev.subjects_of_interest, subject]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-primary-500 to-orange-600 p-3 rounded-2xl shadow-xl">
              <img 
                src="/tutoria-logo.png" 
                alt="TutorIA Logo" 
                className="h-24 w-24 object-contain"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Bienvenido a <span className="text-primary-600">TutorIA</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tu tutor personal con inteligencia artificial disponible 24/7.
            Aprende cualquier tema a tu ritmo, con explicaciones adaptadas a tu nivel.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="text-center p-6">
            <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Chat Inteligente</h3>
            <p className="text-sm text-gray-600">Explica cualquier tema con ejemplos claros</p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Camera className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Escanea Ejercicios</h3>
            <p className="text-sm text-gray-600">Foto a un problema y obtén la solución</p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Tests y Tarjetas</h3>
            <p className="text-sm text-gray-600">Genera material de estudio automático</p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BarChart className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Seguimiento</h3>
            <p className="text-sm text-gray-600">Monitorea tu progreso y evolución</p>
          </div>
        </div>

        {/* Login/Register Form */}
        <div className="max-w-2xl mx-auto">
          <div className="card">
            {/* Mode Selector */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 px-6 py-3 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LogIn className="h-5 w-5" />
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 px-6 py-3 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlus className="h-5 w-5" />
                Registrarse
              </button>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {mode === 'login' ? '¡Bienvenido de nuevo!' : 'Crea tu Perfil de Estudiante'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Campo Nombre (solo en registro) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Tu nombre"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  minLength={mode === 'register' ? 6 : 1}
                />
                {mode === 'register' && (
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                )}
              </div>

              {/* Rol (solo en registro) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ¿Cómo quieres usar TutorIA?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student', class_code: '' })}
                      className={`px-4 py-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.role === 'student'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="h-6 w-6" />
                      <span className="font-semibold">Estudiante</span>
                      <span className="text-xs text-gray-500">Aprende y practica</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'teacher', class_code: '' })}
                      className={`px-4 py-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.role === 'teacher'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <UserCheck className="h-6 w-6" />
                      <span className="font-semibold">Profesor</span>
                      <span className="text-xs text-gray-500">Crea y gestiona clases</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Código de Clase (solo para estudiantes en registro) */}
              {mode === 'register' && formData.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Clase (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.class_code}
                    onChange={(e) => setFormData({ ...formData, class_code: e.target.value.toUpperCase() })}
                    className="input-field"
                    placeholder="Ej: ABC12345"
                    maxLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si tu profesor te dio un código, ingrésalo aquí
                  </p>
                </div>
              )}

              {/* Nivel Educativo (solo en registro) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel Educativo
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                    className="input-field"
                  >
                    {educationLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Materias de Interés (solo en registro) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Materias de Interés (opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.map(subject => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          formData.subjects_of_interest.includes(subject)
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg"
              >
                {loading 
                  ? (mode === 'login' ? 'Iniciando sesión...' : 'Creando perfil...')
                  : (mode === 'login' ? 'Iniciar Sesión' : 'Registrarse')
                }
              </button>
            </form>

            {/* Link para cambiar modo */}
            <div className="mt-6 text-center text-sm text-gray-600">
              {mode === 'login' ? (
                <p>
                  ¿No tienes cuenta?{' '}
                  <button onClick={switchMode} className="text-primary-600 hover:text-primary-700 font-semibold">
                    Regístrate aquí
                  </button>
                </p>
              ) : (
                <p>
                  ¿Ya tienes cuenta?{' '}
                  <button onClick={switchMode} className="text-primary-600 hover:text-primary-700 font-semibold">
                    Inicia sesión aquí
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

