import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ========== AUTHENTICATION ==========
export const register = async (studentData) => {
  const response = await api.post('/api/auth/register', studentData)
  return response.data
}

export const login = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials)
  return response.data
}

// ========== STUDENTS ==========
export const getStudent = async (studentId) => {
  const response = await api.get(`/api/students/${studentId}`)
  return response.data
}

export const getStudentStats = async (studentId) => {
  const response = await api.get(`/api/stats/${studentId}`)
  return response.data
}

// ========== CHAT ==========
export const sendChatMessage = async (chatRequest) => {
  const response = await api.post('/api/chat', chatRequest)
  return response.data
}

export const getConversations = async (studentId) => {
  const response = await api.get(`/api/conversations/${studentId}`)
  return response.data
}

export const getMessages = async (conversationId) => {
  const response = await api.get(`/api/conversations/${conversationId}/messages`)
  return response.data
}

// ========== OCR / IMAGES ==========
export const analyzeImage = async (formData) => {
  const response = await api.post('/api/ocr/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const analyzeExercise = async (formData) => {
  const response = await api.post('/api/ocr/exercise', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// ========== QUIZZES ==========
export const generateQuiz = async (quizData) => {
  const response = await api.post('/api/quiz/generate', quizData)
  return response.data
}

export const submitQuiz = async (quizId, answers) => {
  const response = await api.post(`/api/quiz/${quizId}/submit`, answers)
  return response.data
}

export const getQuizHistory = async (studentId) => {
  const response = await api.get(`/api/quiz/${studentId}/history`)
  return response.data
}

// ========== GAMES (JUEGOS) ==========
export const generatePasapalabra = async (studentId, subject, topic) => {
  const response = await api.post('/api/games/pasapalabra', {
    student_id: studentId,
    subject,
    topic
  })
  return response.data
}

export const generateAtrapaMillon = async (studentId, subject, topic) => {
  const response = await api.post('/api/games/atrapa-millon', {
    student_id: studentId,
    subject,
    topic
  })
  return response.data
}

// ========== GAMES DEMO (SIN IA) ==========
export const generatePasapalabraDemo = async (studentId) => {
  const response = await api.post('/api/games/pasapalabra-demo', {
    student_id: studentId
  })
  return response.data
}

export const generateAtrapaMillonDemo = async (studentId) => {
  const response = await api.post('/api/games/atrapa-millon-demo', {
    student_id: studentId
  })
  return response.data
}

export const generateEscapeRoom = async (studentId, subject, topic) => {
  const response = await api.post('/api/games/escape-room', {
    student_id: studentId,
    subject,
    topic
  })
  return response.data
}

export const generateEscapeRoomDemo = async (studentId) => {
  const response = await api.post('/api/games/escape-room-demo', {
    student_id: studentId
  })
  return response.data
}

export const generateAhorcado = async (studentId, subject, topic) => {
  const response = await api.post('/api/games/ahorcado', {
    student_id: studentId,
    subject,
    topic
  })
  return response.data
}

export const generateAhorcadoDemo = async (studentId) => {
  const response = await api.post('/api/games/ahorcado-demo', {
    student_id: studentId
  })
  return response.data
}

// ========== DOCUMENTS ==========
export const uploadDocument = async (file, title, subject, studentId) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)
  formData.append('subject', subject || '')
  formData.append('student_id', studentId)
  
  const response = await api.post('/api/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const listDocuments = async (studentId) => {
  const response = await api.get(`/api/documents/${studentId}`)
  return response.data
}

export const getDocument = async (studentId, documentId) => {
  const response = await api.get(`/api/documents/${studentId}/${documentId}`)
  return response.data
}

export const deleteDocument = async (studentId, documentId) => {
  const response = await api.delete(`/api/documents/${studentId}/${documentId}`)
  return response.data
}

// ========== STUDY CARDS ==========
export const generateStudyCards = async (cardRequest) => {
  const response = await api.post('/api/cards/generate', cardRequest)
  return response.data
}

export const getStudyCards = async (studentId, subject = null) => {
  const url = subject 
    ? `/api/cards/${studentId}?subject=${subject}`
    : `/api/cards/${studentId}`
  const response = await api.get(url)
  return response.data
}

export const reviewCard = async (cardId, correct) => {
  const response = await api.post(`/api/cards/${cardId}/review`, { correct })
  return response.data
}

// ========== PROGRESS ==========
export const getProgress = async (studentId) => {
  const response = await api.get(`/api/progress/${studentId}`)
  return response.data
}

// ========== CLASSES ==========
export const createClass = async (classData, teacherId) => {
  const response = await api.post(`/api/classes?teacher_id=${teacherId}`, classData)
  return response.data
}

export const getTeacherClasses = async (teacherId) => {
  const response = await api.get(`/api/classes/teacher/${teacherId}`)
  return response.data
}

export const getClassStudents = async (classId, teacherId) => {
  const response = await api.get(`/api/classes/${classId}/students?teacher_id=${teacherId}`)
  return response.data
}

export const getStudentProgressInClass = async (classId, studentId, teacherId) => {
  const response = await api.get(`/api/classes/${classId}/student/${studentId}/progress?teacher_id=${teacherId}`)
  return response.data
}

export const deleteClass = async (classId, teacherId) => {
  const response = await api.delete(`/api/classes/${classId}?teacher_id=${teacherId}`)
  return response.data
}

// ========== SHARED DOCUMENTS ==========
export const shareDocument = async (studentId, documentId, share) => {
  const response = await api.patch(`/api/documents/${studentId}/${documentId}/share?share=${share}`)
  return response.data
}

export const getSharedDocuments = async (classId) => {
  const response = await api.get(`/api/documents/class/${classId}/shared`)
  return response.data
}

// ========== ACTIVITIES ==========
export const createActivity = async (activityData) => {
  const response = await api.post('/api/activities', activityData)
  return response.data
}

export const getActivities = async (classId, studentId = null) => {
  const url = studentId 
    ? `/api/activities/class/${classId}?student_id=${studentId}`
    : `/api/activities/class/${classId}`
  const response = await api.get(url)
  return response.data
}

export const submitActivity = async (submissionData) => {
  const response = await api.post('/api/activities/submit', submissionData)
  return response.data
}

export const getActivitySubmissions = async (activityId) => {
  const response = await api.get(`/api/activities/${activityId}/submissions`)
  return response.data
}

export const deleteActivity = async (activityId, teacherId) => {
  const response = await api.delete(`/api/activities/${activityId}?teacher_id=${teacherId}`)
  return response.data
}

// ========== GAME COMPLETIONS ==========
export const completeGame = async (completionData) => {
  const response = await api.post('/api/games/complete', completionData)
  return response.data
}

export default api

