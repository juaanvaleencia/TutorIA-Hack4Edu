import { useState, useEffect } from 'react'
import { Plus, RotateCw, Check, X } from 'lucide-react'
import { generateStudyCards, getStudyCards, reviewCard } from '../services/api'

function StudyCards({ student }) {
  const [view, setView] = useState('list') // 'list', 'create', 'study'
  const [cards, setCards] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    subject: '',
    content: '',
    num_cards: 10
  })

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = async () => {
    try {
      const data = await getStudyCards(student.id)
      setCards(data)
    } catch (error) {
      console.error('Error cargando tarjetas:', error)
    }
  }

  const handleGenerateCards = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await generateStudyCards({
        student_id: student.id,
        ...generateForm
      })
      
      await loadCards()
      setView('list')
      setGenerateForm({ subject: '', content: '', num_cards: 10 })
    } catch (error) {
      console.error('Error generando tarjetas:', error)
      alert('Error al generar tarjetas')
    } finally {
      setLoading(false)
    }
  }

  const startStudySession = () => {
    if (cards.length > 0) {
      setCurrentCardIndex(0)
      setShowAnswer(false)
      setView('study')
    }
  }

  const handleReview = async (correct) => {
    // Avance optimista para no bloquear la navegación si falla la API
    const cardId = cards[currentCardIndex]?.id

    const goNext = async () => {
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex((idx) => idx + 1)
        setShowAnswer(false)
      } else {
        alert('¡Sesión de estudio completada!')
        await loadCards()
        setView('list')
      }
    }

    // Ir a la siguiente inmediatamente
    await goNext()

    // Registrar la revisión en background
    try {
      if (cardId) {
        await reviewCard(cardId, correct)
      }
    } catch (error) {
      console.error('Error revisando tarjeta:', error)
    }
  }

  const currentCard = cards[currentCardIndex]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tarjetas de Estudio</h1>
          <p className="text-gray-600">Crea y repasa tarjetas tipo flashcards</p>
        </div>
        {view === 'list' && (
          <div className="flex gap-3">
            <button
              onClick={startStudySession}
              disabled={cards.length === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCw className="h-5 w-5" />
              Estudiar
            </button>
            <button
              onClick={() => setView('create')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Generar Tarjetas
            </button>
          </div>
        )}
      </div>

      {/* Create Cards Form */}
      {view === 'create' && (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generar Tarjetas de Estudio</h2>
          
          <form onSubmit={handleGenerateCards} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materia
              </label>
              <input
                type="text"
                required
                value={generateForm.subject}
                onChange={(e) => setGenerateForm({ ...generateForm, subject: e.target.value })}
                className="input-field"
                placeholder="Ej: Historia, Biología, Programación..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido o Tema
              </label>
              <textarea
                required
                value={generateForm.content}
                onChange={(e) => setGenerateForm({ ...generateForm, content: e.target.value })}
                className="input-field resize-none"
                rows="8"
                placeholder="Pega aquí tus apuntes o describe el tema del que quieres generar tarjetas..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Cuanto más detallado sea el contenido, mejores serán las tarjetas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Tarjetas
              </label>
              <select
                value={generateForm.num_cards}
                onChange={(e) => setGenerateForm({ ...generateForm, num_cards: parseInt(e.target.value) })}
                className="input-field"
              >
                <option value="5">5 tarjetas</option>
                <option value="10">10 tarjetas</option>
                <option value="15">15 tarjetas</option>
                <option value="20">20 tarjetas</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setView('list')}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Generando...' : 'Generar Tarjetas'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Study Session */}
      {view === 'study' && currentCard && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              Tarjeta {currentCardIndex + 1} de {cards.length}
            </p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-primary-600 rounded-full transition-all"
                style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="card min-h-[400px] flex flex-col justify-center items-center cursor-pointer"
               onClick={() => setShowAnswer(!showAnswer)}
          >
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-4">
                {showAnswer ? 'Respuesta' : 'Pregunta'}
              </p>
              <p className="text-2xl font-medium text-gray-900 mb-8">
                {showAnswer ? currentCard.answer : currentCard.question}
              </p>
              {!showAnswer && (
                <p className="text-sm text-gray-400">
                  Haz clic para ver la respuesta
                </p>
              )}
            </div>
          </div>

          {showAnswer && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => handleReview(false)}
                className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <X className="h-6 w-6" />
                No la sabía
              </button>
              <button
                onClick={() => handleReview(true)}
                className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="h-6 w-6" />
                La sabía
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setView('list')}
              className="text-gray-600 hover:text-gray-900"
            >
              Terminar sesión
            </button>
          </div>
        </div>
      )}

      {/* Cards List */}
      {view === 'list' && (
        <div className="space-y-4">
          {cards.length === 0 ? (
            <div className="card text-center py-12">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay tarjetas todavía
              </h3>
              <p className="text-gray-600 mb-6">
                Genera tarjetas de estudio a partir de tus apuntes
              </p>
              <button
                onClick={() => setView('create')}
                className="btn-primary"
              >
                Generar Tarjetas
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {cards.map(card => {
                  const accuracy = card.times_reviewed > 0 
                    ? (card.times_correct / card.times_reviewed * 100)
                    : 0
                  
                  return (
                    <div key={card.id} className="card hover:shadow-md transition-shadow">
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                          {card.subject}
                        </span>
                        <span className={`ml-2 inline-block px-2 py-1 text-xs font-medium rounded ${
                          card.difficulty === 'facil' 
                            ? 'bg-green-100 text-green-700'
                            : card.difficulty === 'medio'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {card.difficulty}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-2">
                        {card.question}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        {card.answer}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Revisada {card.times_reviewed} veces</span>
                        {card.times_reviewed > 0 && (
                          <span className={`font-semibold ${
                            accuracy >= 70 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {accuracy.toFixed(0)}% correcta
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default StudyCards

