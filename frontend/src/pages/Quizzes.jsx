import { useState, useEffect } from 'react'
import { generateQuiz, submitQuiz, getQuizHistory } from '../services/api'
import { Plus, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function Quizzes({ student }) {
  const [view, setView] = useState('history') // 'history', 'create', 'taking'
  const [quizHistory, setQuizHistory] = useState([])
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [userAnswers, setUserAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [quizForm, setQuizForm] = useState({
    subject: '',
    topic: '',
    num_questions: 5,
    difficulty: 'medio'
  })

  useEffect(() => {
    loadQuizHistory()
  }, [])

  const loadQuizHistory = async () => {
    try {
      const history = await getQuizHistory(student.id)
      setQuizHistory(history)
    } catch (error) {
      console.error('Error cargando historial:', error)
    }
  }

  const handleCreateQuiz = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const quiz = await generateQuiz({
        student_id: student.id,
        ...quizForm
      })
      
      setCurrentQuiz(quiz)
      setUserAnswers(new Array(quiz.questions.length).fill(null))
      setView('taking')
    } catch (error) {
      console.error('Error generando quiz:', error)
      alert('Error al generar el quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuiz = async () => {
    if (userAnswers.some(a => a === null)) {
      alert('Por favor responde todas las preguntas')
      return
    }

    setLoading(true)
    try {
      const result = await submitQuiz(currentQuiz.id, userAnswers)
      alert(`¡Quiz completado! Puntuación: ${result.score.toFixed(1)}%`)
      await loadQuizHistory()
      setView('history')
      setCurrentQuiz(null)
    } catch (error) {
      console.error('Error enviando quiz:', error)
      alert('Error al enviar el quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-600">Genera tests personalizados para practicar</p>
        </div>
        {view === 'history' && (
          <button
            onClick={() => setView('create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nuevo Quiz
          </button>
        )}
      </div>

      {/* Create Quiz Form */}
      {view === 'create' && (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Quiz</h2>
          
          <form onSubmit={handleCreateQuiz} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materia
              </label>
              <input
                type="text"
                required
                value={quizForm.subject}
                onChange={(e) => setQuizForm({ ...quizForm, subject: e.target.value })}
                className="input-field"
                placeholder="Ej: Matemáticas, Historia, Física..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema Específico
              </label>
              <input
                type="text"
                required
                value={quizForm.topic}
                onChange={(e) => setQuizForm({ ...quizForm, topic: e.target.value })}
                className="input-field"
                placeholder="Ej: Ecuaciones cuadráticas, Segunda Guerra Mundial..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Preguntas
                </label>
                <select
                  value={quizForm.num_questions}
                  onChange={(e) => setQuizForm({ ...quizForm, num_questions: parseInt(e.target.value) })}
                  className="input-field"
                >
                  <option value="5">5 preguntas</option>
                  <option value="10">10 preguntas</option>
                  <option value="15">15 preguntas</option>
                  <option value="20">20 preguntas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dificultad
                </label>
                <select
                  value={quizForm.difficulty}
                  onChange={(e) => setQuizForm({ ...quizForm, difficulty: e.target.value })}
                  className="input-field"
                >
                  <option value="facil">Fácil</option>
                  <option value="medio">Medio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setView('history')}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Generando...' : 'Generar Quiz'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Taking Quiz */}
      {view === 'taking' && currentQuiz && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentQuiz.title}</h2>
            <p className="text-gray-600 mb-4">
              {currentQuiz.questions.length} preguntas • {currentQuiz.subject}
            </p>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-primary-600 rounded-full transition-all"
                style={{
                  width: `${(userAnswers.filter(a => a !== null).length / currentQuiz.questions.length) * 100}%`
                }}
              />
            </div>
          </div>

          {currentQuiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="card">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                  {qIndex + 1}
                </span>
                <p className="text-lg font-medium text-gray-900 flex-1">
                  {question.question}
                </p>
              </div>

              <div className="space-y-2 ml-11">
                {question.options.map((option, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => {
                      const newAnswers = [...userAnswers]
                      newAnswers[qIndex] = oIndex
                      setUserAnswers(newAnswers)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      userAnswers[qIndex] === oIndex
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setView('history')
                setCurrentQuiz(null)
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitQuiz}
              disabled={loading || userAnswers.some(a => a === null)}
              className="btn-primary flex-1"
            >
              {loading ? 'Enviando...' : 'Enviar Quiz'}
            </button>
          </div>
        </div>
      )}

      {/* Quiz History */}
      {view === 'history' && (
        <div className="space-y-4">
          {quizHistory.length === 0 ? (
            <div className="card text-center py-12">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay quizzes todavía
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primer quiz para empezar a practicar
              </p>
              <button
                onClick={() => setView('create')}
                className="btn-primary"
              >
                Crear Quiz
              </button>
            </div>
          ) : (
            quizHistory.map(quiz => (
              <div key={quiz.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {quiz.subject} • {quiz.questions.length} preguntas
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        {new Date(quiz.created_at).toLocaleDateString('es-ES')}
                      </span>
                      {quiz.completed && (
                        <span className={`font-semibold ${
                          quiz.score >= 70 ? 'text-green-600' : quiz.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          Puntuación: {quiz.score.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {quiz.completed ? (
                      <div className={`p-3 rounded-full ${
                        quiz.score >= 70 ? 'bg-green-100' : quiz.score >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {quiz.score >= 70 ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-full bg-gray-100">
                        <Clock className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Quizzes

