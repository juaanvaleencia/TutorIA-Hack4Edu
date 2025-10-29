import { useState, useEffect } from 'react'
import { createClass, getTeacherClasses, getClassStudents, getStudentProgressInClass, deleteClass, createActivity, getActivities, getActivitySubmissions, deleteActivity } from '../services/api'
import { Users, Plus, Copy, Trash2, BarChart, ChevronRight, CheckCircle, ClipboardList, Send, Calendar, Loader } from 'lucide-react'

function TeacherDashboard({ student }) {
  const [activeTab, setActiveTab] = useState('students') // 'students' o 'activities'
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentProgress, setStudentProgress] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  // Estados para actividades
  const [activities, setActivities] = useState([])
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityFormData, setActivityFormData] = useState({
    title: '',
    description: '',
    subject: '',
    due_date: '',
    activity_type: 'exercise'
  })

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const data = await getTeacherClasses(student.id)
      setClasses(data)
    } catch (error) {
      console.error('Error cargando clases:', error)
    }
  }

  const handleCreateClass = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createClass(formData, student.id)
      setFormData({ name: '', description: '' })
      setShowCreateForm(false)
      loadClasses()
    } catch (error) {
      alert('Error al crear la clase')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectClass = async (classObj) => {
    setSelectedClass(classObj)
    setSelectedStudent(null)
    setStudentProgress(null)
    try {
      const studentsData = await getClassStudents(classObj.id, student.id)
      setStudents(studentsData)
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
    }
  }

  const handleSelectStudent = async (studentObj) => {
    setSelectedStudent(studentObj)
    setStudentProgress(null) // Resetear primero
    if (!selectedClass) {
      console.error('No hay clase seleccionada')
      return
    }
    try {
      const progress = await getStudentProgressInClass(selectedClass.id, studentObj.id, student.id)
      // Asegurar que todos los campos están presentes con valores por defecto
      setStudentProgress({
        total_conversations: progress.total_conversations || 0,
        total_questions: progress.total_questions || 0,
        quizzes_completed: progress.quizzes_completed || 0,
        average_quiz_score: progress.average_quiz_score || 0,
        study_cards_created: progress.study_cards_created || 0,
        documents_uploaded: progress.documents_uploaded || 0,
        recent_activity: progress.recent_activity || []
      })
    } catch (error) {
      console.error('Error cargando progreso:', error)
      console.error('Detalles del error:', error.response?.data || error.message)
      alert(`Error al cargar el progreso del estudiante: ${error.response?.data?.detail || error.message}`)
      setStudentProgress(null)
    }
  }

  const handleDeleteClass = async (classId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clase?')) return
    try {
      await deleteClass(classId, student.id)
      setSelectedClass(null)
      setStudents([])
      loadClasses()
    } catch (error) {
      alert('Error al eliminar la clase')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Código copiado al portapapeles')
  }

  // Funciones para actividades
  const loadActivities = async (classId) => {
    try {
      const data = await getActivities(classId)
      setActivities(data.activities)
    } catch (error) {
      console.error('Error cargando actividades:', error)
    }
  }

  const handleCreateActivity = async (e) => {
    e.preventDefault()
    if (!selectedClass) {
      alert('Selecciona una clase primero')
      return
    }

    setLoading(true)
    try {
      await createActivity({
        ...activityFormData,
        class_id: selectedClass.id,
        teacher_id: student.id
      })
      
      setActivityFormData({
        title: '',
        description: '',
        subject: '',
        due_date: '',
        activity_type: 'exercise'
      })
      setShowActivityForm(false)
      loadActivities(selectedClass.id)
      alert('¡Actividad creada correctamente!')
    } catch (error) {
      alert('Error al crear la actividad')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectActivity = async (activity) => {
    setSelectedActivity(activity)
    try {
      const data = await getActivitySubmissions(activity.id)
      setSubmissions(data.submissions)
    } catch (error) {
      console.error('Error cargando entregas:', error)
    }
  }

  const handleDeleteActivity = async (activityId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) return
    try {
      await deleteActivity(activityId, student.id)
      setSelectedActivity(null)
      setSubmissions([])
      loadActivities(selectedClass.id)
      alert('Actividad eliminada correctamente')
    } catch (error) {
      alert('Error al eliminar la actividad')
    }
  }

  useEffect(() => {
    if (selectedClass && activeTab === 'activities') {
      loadActivities(selectedClass.id)
    }
  }, [selectedClass, activeTab])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Profesor</h1>
        <p className="text-gray-600">Gestiona tus clases y monitorea el progreso de tus estudiantes</p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-3 font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'students'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-5 w-5" />
          Estudiantes
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-3 font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'activities'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ClipboardList className="h-5 w-5" />
          Actividades
        </button>
      </div>

      {activeTab === 'students' ? (
        <div className="grid lg:grid-cols-3 gap-6">
        {/* Lista de Clases */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Mis Clases</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-primary px-3 py-2 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nueva
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateClass} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Clase
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Ej: Matemáticas 3º ESO"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="2"
                    placeholder="Descripción de la clase..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Creando...' : 'Crear Clase'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {classes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No tienes clases aún. ¡Crea tu primera clase!
                </p>
              ) : (
                classes.map((classObj) => (
                  <div
                    key={classObj.id}
                    onClick={() => handleSelectClass(classObj)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedClass?.id === classObj.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{classObj.name}</h3>
                    {classObj.description && (
                      <p className="text-sm text-gray-600 mt-1">{classObj.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>{classObj.students?.length || 0} estudiantes</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(classObj.code)
                        }}
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                      >
                        <Copy className="h-4 w-4" />
                        {classObj.code}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Estudiantes de la Clase */}
        <div className="lg:col-span-1">
          {selectedClass ? (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedClass.name}</h2>
                  <p className="text-sm text-gray-600">Estudiantes inscritos</p>
                </div>
                <button
                  onClick={() => handleDeleteClass(selectedClass.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Eliminar clase"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">Código de la clase:</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-bold text-amber-700">{selectedClass.code}</code>
                  <button
                    onClick={() => copyToClipboard(selectedClass.code)}
                    className="text-amber-600 hover:text-amber-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Comparte este código con tus estudiantes para que se unan
                </p>
              </div>

              <div className="space-y-2">
                {students.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Aún no hay estudiantes en esta clase
                  </p>
                ) : (
                  students.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedStudent?.id === s.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{s.name}</h3>
                          <p className="text-sm text-gray-600">{s.email}</p>
                          <p className="text-xs text-gray-500 mt-1 capitalize">{s.education_level}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona una clase para ver sus estudiantes</p>
              </div>
            </div>
          )}
        </div>

        {/* Progreso del Estudiante */}
        <div className="lg:col-span-1">
          {selectedStudent ? (
            studentProgress ? (
              <div className="card">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                  <p className="text-sm text-gray-600">Progreso del estudiante</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-medium text-gray-700">Actividad</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{studentProgress.total_questions || 0}</p>
                    <p className="text-xs text-gray-600">Preguntas realizadas</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Juegos</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{studentProgress.quizzes_completed || 0}</p>
                    <p className="text-xs text-gray-600">Juegos completados</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Promedio</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">
                      {studentProgress.average_quiz_score ? studentProgress.average_quiz_score.toFixed(1) : '0.0'}%
                    </p>
                    <p className="text-xs text-gray-600">Puntuación en juegos</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Tarjetas</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{studentProgress.study_cards_created || 0}</p>
                    <p className="text-xs text-gray-600">Tarjetas de estudio creadas</p>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart className="h-5 w-5 text-pink-600" />
                      <span className="text-sm font-medium text-gray-700">Documentos</span>
                    </div>
                    <p className="text-3xl font-bold text-pink-600">{studentProgress.documents_uploaded || 0}</p>
                    <p className="text-xs text-gray-600">Documentos subidos</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-12">
                  <Loader className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Cargando progreso...</p>
                </div>
              </div>
            )
          ) : selectedClass ? (
            <div className="card">
              <div className="text-center py-12">
                <BarChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona un estudiante para ver su progreso</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <BarChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona una clase primero</p>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        // Vista de Actividades
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lista de Clases para Actividades */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Selecciona una Clase</h2>
              <div className="space-y-2">
                {classes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No tienes clases aún.
                  </p>
                ) : (
                  classes.map((classObj) => (
                    <div
                      key={classObj.id}
                      onClick={() => setSelectedClass(classObj)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedClass?.id === classObj.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">{classObj.name}</h3>
                      {classObj.description && (
                        <p className="text-sm text-gray-600 mt-1">{classObj.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Lista de Actividades */}
          <div className="lg:col-span-1">
            {selectedClass ? (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Actividades</h2>
                    <p className="text-sm text-gray-600">{selectedClass.name}</p>
                  </div>
                  <button
                    onClick={() => setShowActivityForm(!showActivityForm)}
                    className="btn-primary px-3 py-2 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva
                  </button>
                </div>

                {showActivityForm && (
                  <form onSubmit={handleCreateActivity} className="mb-4 p-4 bg-amber-50 rounded-lg">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        required
                        value={activityFormData.title}
                        onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                        className="input-field"
                        placeholder="Ej: Resolver ejercicios del tema 3"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        required
                        value={activityFormData.description}
                        onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
                        className="input-field"
                        rows="3"
                        placeholder="Describe la actividad..."
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Materia (opcional)
                      </label>
                      <input
                        type="text"
                        value={activityFormData.subject}
                        onChange={(e) => setActivityFormData({ ...activityFormData, subject: e.target.value })}
                        className="input-field"
                        placeholder="Ej: Matemáticas"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Entrega (opcional)
                      </label>
                      <input
                        type="datetime-local"
                        value={activityFormData.due_date}
                        onChange={(e) => setActivityFormData({ ...activityFormData, due_date: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Actividad
                      </label>
                      <select
                        value={activityFormData.activity_type}
                        onChange={(e) => setActivityFormData({ ...activityFormData, activity_type: e.target.value })}
                        className="input-field"
                      >
                        <option value="exercise">Ejercicio</option>
                        <option value="quiz">Cuestionario</option>
                        <option value="reading">Lectura</option>
                        <option value="project">Proyecto</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1"
                      >
                        {loading ? 'Creando...' : 'Crear Actividad'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowActivityForm(false)}
                        className="btn-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No hay actividades en esta clase
                    </p>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        onClick={() => handleSelectActivity(activity)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedActivity?.id === activity.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                        {activity.subject && (
                          <p className="text-sm text-amber-600 mt-1">📚 {activity.subject}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                          <span>📅 {new Date(activity.created_at).toLocaleDateString()}</span>
                          {activity.due_date && (
                            <span>⏰ {new Date(activity.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-12">
                  <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona una clase para ver sus actividades</p>
                </div>
              </div>
            )}
          </div>

          {/* Entregas de la Actividad */}
          <div className="lg:col-span-1">
            {selectedActivity ? (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Entregas</h2>
                    <p className="text-sm text-gray-600">{selectedActivity.title}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteActivity(selectedActivity.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Eliminar actividad"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {submissions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Aún no hay entregas
                    </p>
                  ) : (
                    submissions.map((submission) => (
                      <div key={submission.id} className="p-4 rounded-lg border-2 border-gray-200 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{submission.student_name}</h3>
                            <p className="text-xs text-gray-600">
                              {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            submission.status === 'graded'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {submission.status === 'graded' ? '✅ Calificada' : '⏳ Pendiente'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                          {submission.content}
                        </p>
                        
                        {submission.score !== null && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-green-600">
                              📊 {submission.score}/10
                            </span>
                          </div>
                        )}
                        
                        {submission.feedback && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                            <strong>Comentario:</strong> {submission.feedback}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {submissions.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg text-center">
                    <p className="text-sm text-gray-700">
                      <strong>{submissions.length}</strong> entrega(s) recibida(s)
                    </p>
                  </div>
                )}
              </div>
            ) : selectedClass ? (
              <div className="card">
                <div className="text-center py-12">
                  <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona una actividad para ver las entregas</p>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-12">
                  <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona una clase primero</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard

