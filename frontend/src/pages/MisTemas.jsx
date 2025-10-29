import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Trash2, Eye, Plus, BookOpen, Download, Share2 } from 'lucide-react'
import { uploadDocument, listDocuments, deleteDocument, getDocument, shareDocument, getSharedDocuments } from '../services/api'

function MisTemas({ student }) {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [sharedDocuments, setSharedDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [selectedTab, setSelectedTab] = useState('my-docs') // 'my-docs' o 'teacher-docs'
  
  // Form data
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')

  useEffect(() => {
    loadDocuments()
    if (student.role === 'student' && student.class_id) {
      loadSharedDocuments()
    }
  }, [student])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const data = await listDocuments(student.id)
      setDocuments(data.documents)
    } catch (error) {
      console.error('Error al cargar documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSharedDocuments = async () => {
    try {
      const data = await getSharedDocuments(student.class_id)
      setSharedDocuments(data.documents)
    } catch (error) {
      console.error('Error al cargar documentos compartidos:', error)
    }
  }

  const handleShareToggle = async (documentId, currentlyShared) => {
    try {
      await shareDocument(student.id, documentId, !currentlyShared)
      await loadDocuments()
      alert(currentlyShared ? 'Documento descompartido' : '¡Documento compartido con tu clase!')
    } catch (error) {
      console.error('Error al compartir documento:', error)
      alert('Error al compartir el documento')
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-completar título con el nombre del archivo (sin extensión)
      if (!title) {
        const fileName = selectedFile.name.split('.').slice(0, -1).join('.')
        setTitle(fileName)
      }
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      alert('Por favor selecciona un archivo')
      return
    }

    try {
      setUploading(true)
      await uploadDocument(file, title, subject, student.id)
      
      // Resetear formulario
      setFile(null)
      setTitle('')
      setSubject('')
      setShowUploadForm(false)
      
      // Recargar documentos
      await loadDocuments()
      
      alert('¡Documento subido correctamente!')
    } catch (error) {
      console.error('Error al subir documento:', error)
      alert(error.response?.data?.detail || 'Error al subir el documento')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return
    }

    try {
      await deleteDocument(student.id, documentId)
      await loadDocuments()
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null)
      }
    } catch (error) {
      console.error('Error al eliminar documento:', error)
      alert('Error al eliminar el documento')
    }
  }

  const handleView = async (doc) => {
    try {
      const data = await getDocument(student.id, doc.id)
      setSelectedDocument(data.document)
    } catch (error) {
      console.error('Error al cargar documento:', error)
      alert('Error al cargar el contenido del documento')
    }
  }

  const getFileIcon = (fileType) => {
    switch(fileType) {
      case 'pdf':
        return '📄'
      case 'docx':
        return '📘'
      case 'txt':
        return '📝'
      default:
        return '📄'
    }
  }

  if (selectedDocument) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedDocument(null)}
          className="btn-secondary mb-6 flex items-center gap-2"
        >
          ← Volver a Mis Temas
        </button>

        <div className="card">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{selectedDocument.title}</h2>
            {selectedDocument.subject && (
              <p className="text-lg text-amber-600 mt-2">📚 {selectedDocument.subject}</p>
            )}
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <span>{getFileIcon(selectedDocument.file_type)} {selectedDocument.file_type.toUpperCase()}</span>
              <span>📊 {selectedDocument.word_count.toLocaleString()} palabras</span>
              <span>📅 {new Date(selectedDocument.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap font-mono text-sm">
              {selectedDocument.content}
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">¿Qué quieres hacer con este tema?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button 
                onClick={() => {
                  sessionStorage.setItem('currentDocument', JSON.stringify(selectedDocument))
                  navigate('/chat')
                }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                💬 Chatear sobre el tema
              </button>
              <button 
                onClick={() => {
                  sessionStorage.setItem('currentDocument', JSON.stringify(selectedDocument))
                  navigate('/juegos')
                }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                🎮 Generar juegos
              </button>
              <button 
                onClick={() => {
                  sessionStorage.setItem('currentDocument', JSON.stringify(selectedDocument))
                  navigate('/cards')
                }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                🎴 Crear tarjetas
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 Mis Temas</h1>
          <p className="text-xl text-gray-600">
            Sube tus apuntes y genera contenido educativo automáticamente
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md"
        >
          {showUploadForm ? '✕ Cancelar' : <><Plus className="h-5 w-5" /> Subir Documento</>}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="card mb-8 bg-amber-50 border-2 border-amber-200">
          <h3 className="text-2xl font-bold text-amber-900 mb-4">Subir Nuevo Documento</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo (PDF, DOCX o TXT - Máx. 10MB)
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none"
                required
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  {getFileIcon(file.name.split('.').pop())} {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del tema
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Ej: Tema 3 - La Revolución Francesa"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materia (opcional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
                placeholder="Ej: Historia"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md"
            >
              {uploading ? (
                <>⏳ Subiendo y procesando...</>
              ) : (
                <><Upload className="h-5 w-5" /> Subir Documento</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Info Box */}
      <div className="card bg-amber-50 border-2 border-amber-200 mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-lg shadow-md">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900 mb-2">¿Cómo funciona?</h3>
            <ul className="text-amber-800 space-y-1">
              <li>✅ Sube tus apuntes en PDF, DOCX o TXT</li>
              <li>✅ El contenido se extrae y procesa automáticamente</li>
              <li>✅ Genera chats, juegos y tarjetas basados en tu tema</li>
              <li>✅ Estudia de forma más eficiente y personalizada</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs para Alumnos */}
      {student.role === 'student' && student.class_id && (
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setSelectedTab('my-docs')}
            className={`px-4 py-3 font-semibold transition-all ${
              selectedTab === 'my-docs'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📚 Mis Documentos
          </button>
          <button
            onClick={() => setSelectedTab('teacher-docs')}
            className={`px-4 py-3 font-semibold transition-all ${
              selectedTab === 'teacher-docs'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👨‍🏫 Documentos del Profesor
          </button>
        </div>
      )}

      {/* Documents List */}
      {selectedTab === 'my-docs' ? (
        loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-xl text-gray-600">Cargando tus temas...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No tienes temas todavía</h3>
            <p className="text-gray-600 mb-6">Sube tu primer documento para empezar</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" /> Subir Primer Documento
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc.id} className="card hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{getFileIcon(doc.file_type)}</div>
                  <div className="flex gap-2">
                    {student.role === 'teacher' && (
                      <button
                        onClick={() => handleShareToggle(doc.id, doc.is_shared)}
                        className={`p-2 rounded-lg transition-all ${
                          doc.is_shared
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        title={doc.is_shared ? 'Compartido con la clase' : 'Compartir con la clase'}
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {doc.title}
                </h3>
                
                {doc.subject && (
                  <p className="text-amber-600 font-semibold mb-3">
                    📚 {doc.subject}
                  </p>
                )}
                
                {student.role === 'teacher' && doc.is_shared && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                      <Share2 className="h-3 w-3" /> Compartido
                    </span>
                  </div>
                )}
                
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>📊 {doc.word_count.toLocaleString()} palabras</p>
                  <p>📅 {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                
                <button
                  onClick={() => handleView(doc)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md"
                >
                  <Eye className="h-4 w-4" /> Ver y Usar
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        // Vista de Documentos del Profesor (solo para alumnos)
        sharedDocuments.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay documentos compartidos</h3>
            <p className="text-gray-600">Tu profesor aún no ha compartido ningún documento</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedDocuments.map((doc) => (
              <div key={doc.id} className="card hover:shadow-xl transition-shadow border-2 border-amber-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{getFileIcon(doc.file_type)}</div>
                  <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">
                    👨‍🏫 Profesor
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {doc.title}
                </h3>
                
                {doc.subject && (
                  <p className="text-amber-600 font-semibold mb-3">
                    📚 {doc.subject}
                  </p>
                )}
                
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>📊 {doc.word_count.toLocaleString()} palabras</p>
                  <p>📅 {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                
                <button
                  onClick={() => setSelectedDocument(doc)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md"
                >
                  <Eye className="h-4 w-4" /> Ver Documento
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default MisTemas

