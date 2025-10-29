import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Clock, FileText, Send, AlertCircle } from 'lucide-react'
import { getActivities, submitActivity } from '../services/api'

function Actividades({ student }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [submissionText, setSubmissionText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (student.class_id) {
      loadActivities()
    }
  }, [student])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const data = await getActivities(student.class_id, student.id)
      setActivities(data.activities)
    } catch (error) {
      console.error('Error al cargar actividades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!submissionText.trim()) {
      alert('Por favor escribe tu respuesta')
      return
    }

    try {
      setSubmitting(true)
      await submitActivity({
        activity_id: selectedActivity.id,
        student_id: student.id,
        content: submissionText
      })
      
      alert('¡Actividad enviada correctamente!')
      setSubmissionText('')
      setSelectedActivity(null)
      await loadActivities()
    } catch (error) {
      console.error('Error al enviar actividad:', error)
      alert('Error al enviar la actividad')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (submission) => {
    if (!submission || submission.status === 'not_submitted') {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
          <AlertCircle className="h-3 w-3" /> Pendiente
        </span>
      )
    }
    
    if (submission.status === 'submitted') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">
          <Clock className="h-3 w-3" /> Enviada
        </span>
      )
    }
    
    if (submission.status === 'graded') {
      return (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
          <CheckCircle className="h-3 w-3" /> Calificada
        </span>
      )
    }
  }

  const getActivityTypeIcon = (type) => {
    switch(type) {
      case 'quiz':
        return '❓'
      case 'reading':
        return '📖'
      case 'project':
        return '🏗️'
      default:
        return '✍️'
    }
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  // Si no está en una clase
  if (!student.class_id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🏫</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No estás en ninguna clase</h3>
          <p className="text-gray-600">
            Para ver las actividades, primero únete a una clase usando el código que te proporcione tu profesor
          </p>
        </div>
      </div>
    )
  }

  // Vista de detalle de actividad
  if (selectedActivity) {
    const submission = selectedActivity.submission
    const isSubmitted = submission && submission.status !== 'not_submitted'

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedActivity(null)}
          className="btn-secondary mb-6 flex items-center gap-2"
        >
          ← Volver a Actividades
        </button>

        <div className="card">
          <div className="border-b pb-4 mb-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getActivityTypeIcon(selectedActivity.activity_type)}</span>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedActivity.title}</h2>
                  {selectedActivity.subject && (
                    <p className="text-lg text-amber-600 mt-1">📚 {selectedActivity.subject}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(submission)}
            </div>

            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <span>📅 Creada: {new Date(selectedActivity.created_at).toLocaleDateString()}</span>
              {selectedActivity.due_date && (
                <span className={isOverdue(selectedActivity.due_date) ? 'text-red-600 font-semibold' : ''}>
                  ⏰ Entrega: {new Date(selectedActivity.due_date).toLocaleDateString()}
                  {isOverdue(selectedActivity.due_date) && !isSubmitted && ' (Vencida)'}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">📝 Descripción</h3>
            <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap">
              {selectedActivity.description}
            </div>
          </div>

          {isSubmitted ? (
            <div className="space-y-6">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">✅ Tu Entrega</h3>
                <div className="bg-white rounded-lg p-4 whitespace-pre-wrap mb-3">
                  {submission.content}
                </div>
                <p className="text-sm text-gray-600">
                  📅 Enviada el: {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>

              {submission.status === 'graded' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">📊 Calificación</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl font-bold text-green-600">{submission.score}/10</div>
                    <div className="text-sm text-gray-600">
                      Calificada el: {new Date(submission.graded_at).toLocaleDateString()}
                    </div>
                  </div>
                  {submission.feedback && (
                    <>
                      <h4 className="font-semibold text-gray-900 mb-2">💬 Retroalimentación del Profesor:</h4>
                      <div className="bg-white rounded-lg p-4 whitespace-pre-wrap">
                        {submission.feedback}
                      </div>
                    </>
                  )}
                </div>
              )}

              {submission.status === 'submitted' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                  <Clock className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <p className="text-blue-900 font-semibold">
                    Tu profesor está revisando tu entrega
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Tu Respuesta
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full min-h-[300px] border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-amber-500 focus:outline-none"
                  placeholder="Escribe tu respuesta aquí..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                {submitting ? (
                  <>⏳ Enviando...</>
                ) : (
                  <><Send className="h-5 w-5" /> Enviar Actividad</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Vista principal de lista de actividades
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 Mis Actividades</h1>
        <p className="text-xl text-gray-600">
          Revisa y completa las actividades asignadas por tu profesor
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Cargando actividades...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay actividades</h3>
          <p className="text-gray-600">Tu profesor aún no ha asignado ninguna actividad</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const submission = activity.submission
            const isSubmitted = submission && submission.status !== 'not_submitted'
            const overdue = isOverdue(activity.due_date)

            return (
              <div 
                key={activity.id} 
                className={`card hover:shadow-xl transition-shadow cursor-pointer ${
                  overdue && !isSubmitted ? 'border-2 border-red-200' : ''
                }`}
                onClick={() => setSelectedActivity(activity)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-4xl">{getActivityTypeIcon(activity.activity_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{activity.title}</h3>
                        {getStatusBadge(submission)}
                      </div>
                      
                      {activity.subject && (
                        <p className="text-amber-600 font-semibold mb-2">
                          📚 {activity.subject}
                        </p>
                      )}
                      
                      <p className="text-gray-600 line-clamp-2 mb-3">
                        {activity.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span>📅 {new Date(activity.created_at).toLocaleDateString()}</span>
                        {activity.due_date && (
                          <span className={overdue && !isSubmitted ? 'text-red-600 font-semibold' : ''}>
                            ⏰ Entrega: {new Date(activity.due_date).toLocaleDateString()}
                            {overdue && !isSubmitted && ' (Vencida)'}
                          </span>
                        )}
                        {submission?.score !== null && submission?.score !== undefined && (
                          <span className="text-green-600 font-semibold">
                            📊 Calificación: {submission.score}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Actividades

