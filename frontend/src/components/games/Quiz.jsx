import { useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { generateQuiz, submitQuiz } from '../../services/api'

function Quiz({ student, onBack }) {
  const [step, setStep] = useState('config') // 'config', 'playing', 'result'
  const [form, setForm] = useState({ subject: '', topic: '', num_questions: 5, difficulty: 'medio' })
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleStart = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await generateQuiz({ student_id: student.id, ...form })
      setQuiz(data)
      setAnswers(new Array(data.questions.length).fill(null))
      setStep('playing')
    } catch (error) {
      alert('Error al generar el quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (answers.some(a => a === null)) {
      alert('Responde todas las preguntas')
      return
    }
    setLoading(true)
    try {
      const res = await submitQuiz(quiz.id, answers)
      setResult(res)
      setStep('result')
    } catch (error) {
      alert('Error al enviar')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'config') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={onBack} className="btn-secondary mb-6 flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" /> Volver
        </button>
        <div className="card">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Configurar Quiz</h2>
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Materia</label>
              <input required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="input-field" placeholder="Ej: Matemáticas, Historia..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
              <input required value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} className="input-field" placeholder="Ej: Ecuaciones, Segunda Guerra Mundial..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preguntas</label>
                <select value={form.num_questions} onChange={(e) => setForm({...form, num_questions: parseInt(e.target.value)})} className="input-field">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dificultad</label>
                <select value={form.difficulty} onChange={(e) => setForm({...form, difficulty: e.target.value})} className="input-field">
                  <option value="facil">Fácil</option>
                  <option value="medio">Medio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3">{loading ? 'Generando...' : 'Comenzar Quiz'}</button>
          </form>
        </div>
      </div>
    )
  }

  if (step === 'playing') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h2>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{width: `${(answers.filter(a => a !== null).length / quiz.questions.length) * 100}%`}} />
          </div>
        </div>
        {quiz.questions.map((q, i) => (
          <div key={i} className="card mb-4">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">{i + 1}</span>
              <p className="text-lg font-medium text-gray-900 flex-1">{q.question}</p>
            </div>
            <div className="space-y-2 ml-11">
              {q.options.map((opt, j) => (
                <button key={j} onClick={() => { const newAns = [...answers]; newAns[i] = j; setAnswers(newAns) }} className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${answers[i] === j ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span>{opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button onClick={handleSubmit} disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
          <Send className="h-5 w-5" /> {loading ? 'Enviando...' : 'Enviar Respuestas'}
        </button>
      </div>
    )
  }

  if (step === 'result') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Quiz Completado!</h2>
          <div className={`text-6xl font-bold mb-6 ${result.score >= 70 ? 'text-green-600' : result.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {result.score.toFixed(1)}%
          </div>
          <p className="text-xl text-gray-600 mb-8">{result.correct_answers} de {result.total_questions} respuestas correctas</p>
          <div className="flex gap-4">
            <button onClick={() => { setStep('config'); setQuiz(null); setResult(null) }} className="flex-1 btn-primary">Nuevo Quiz</button>
            <button onClick={onBack} className="flex-1 btn-secondary">Volver a Juegos</button>
          </div>
        </div>
      </div>
    )
  }
}

export default Quiz

