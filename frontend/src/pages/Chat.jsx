import { useState, useEffect, useRef } from 'react'
import { Send, Image, Loader, Paperclip, Mic, MicOff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { sendChatMessage, getConversations, analyzeExercise } from '../services/api'
import DonPippoGame from '../components/DonPipoGame'

function Chat({ student }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [showPippoGame, setShowPippoGame] = useState(false)
  const [pippoStats, setPippoStats] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Mensaje de bienvenida de Don Pippo
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `# ¡Salve, ${student.name}! 🏛️\n\nSoy **Don Pippo**, tu maestro romano personal. ¡Bienvenido a tu espacio de aprendizaje!\n\n## 🎓 ¿Cómo puedo ayudarte?\n\n✨ **Pregúntame sobre cualquier tema** que estés estudiando\n\n📸 **Envíame fotos de ejercicios** y los resolvemos juntos\n\n💡 **Explicaciones paso a paso** adaptadas a tu nivel\n\n📚 **Ejemplos, resúmenes y trucos** para estudiar mejor\n\n---\n\n**No te preocupes si algo no lo entiendes a la primera**, ¡para eso estoy aquí! \n\nComo decían los sabios romanos: *"La paciencia es la compañera de la sabiduría"* 🦉\n\n### ¿Qué te gustaría aprender hoy?`,
        created_at: new Date().toISOString()
      }])
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'es-ES' // Español
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }
      
      recognition.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error)
        setIsListening(false)
        if (event.error === 'no-speech') {
          alert('No se detectó voz. Intenta de nuevo.')
        } else if (event.error === 'not-allowed') {
          alert('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración de tu navegador.')
        }
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
      
      recognitionRef.current = recognition
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Cargar stats de Don Pippo
  useEffect(() => {
    const saved = localStorage.getItem('donPippoStats')
    if (saved) {
      setPippoStats(JSON.parse(saved))
    }
    
    // Actualizar stats cada vez que se abre el juego
    const interval = setInterval(() => {
      const updated = localStorage.getItem('donPippoStats')
      if (updated) {
        setPippoStats(JSON.parse(updated))
      }
    }, 1000) // Actualizar cada segundo
    
    return () => clearInterval(interval)
  }, [showPippoGame])

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ((!inputMessage.trim() && !selectedImage) || loading) return

    setLoading(true)
    const userMessage = inputMessage.trim()
    setInputMessage('')

    // Agregar mensaje del usuario
    const newUserMessage = {
      role: 'user',
      content: userMessage || '(Imagen adjunta)',
      image_url: imagePreview,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      let imageData = null
      
      // Si hay imagen, convertir a base64
      if (selectedImage) {
        const reader = new FileReader()
        imageData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(selectedImage)
        })
      }

      // Enviar mensaje al backend
      const response = await sendChatMessage({
        student_id: student.id,
        conversation_id: currentConversationId,
        message: userMessage || 'Por favor, analiza esta imagen',
        image_data: imageData
      })

      // Actualizar ID de conversación si es nuevo
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id)
      }

      // Agregar respuesta de la IA
      setMessages(prev => [...prev, response.assistant_response])

      // Limpiar imagen
      removeImage()

    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        created_at: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Header con Don Pippo - Compacto */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 border-b-2 border-amber-700 px-6 py-3 shadow-lg">
        <div className="flex items-center justify-center gap-4">
          {/* Don Pippo - Imagen Compacta (Clickeable) */}
          <button
            onClick={() => setShowPippoGame(true)}
            className="relative group cursor-pointer transform transition-all hover:scale-110"
            title="¡Click para jugar con Don Pippo!"
          >
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-full p-2 shadow-lg border-2 border-amber-300 group-hover:border-amber-400 group-hover:shadow-xl transition-all">
              <img 
                src={mood.image}
                alt="Don Pippo - Tu Maestro Romano" 
                className="w-16 h-16 rounded-full object-cover"
              />
              {/* Indicador de click */}
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg group-hover:animate-bounce">
                🎮
              </div>
            </div>
          </button>
          
          {/* Nombre de Don Pippo */}
          <div className="text-left">
            <h1 className="text-2xl font-black text-white drop-shadow-lg flex items-center gap-2">
              Don Pippo 🏛️
            </h1>
            <p className="text-sm text-amber-50 font-medium">Tu Maestro Romano Personal</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Avatar de Don Pippo */}
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 bg-amber-100 rounded-full p-1 shadow-lg border-2 border-amber-300">
                <img 
                  src={mood.image}
                  alt="Don Pippo" 
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
            )}
            
            <div
              className={`max-w-3xl rounded-2xl px-4 py-3 shadow-sm ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'bg-white border-2 border-amber-200 text-gray-900'
              }`}
            >
              {message.image_url && (
                <img
                  src={message.image_url}
                  alt="Imagen adjunta"
                  className="rounded-lg mb-2 max-w-sm"
                />
              )}
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className={message.role === 'user' ? 'text-white' : 'text-gray-900'}>{children}</p>,
                    strong: ({ children }) => <strong className={message.role === 'user' ? 'text-white font-bold' : 'text-gray-900 font-bold'}>{children}</strong>,
                    ul: ({ children }) => <ul className={`list-disc ml-4 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>{children}</ul>,
                    ol: ({ children }) => <ol className={`list-decimal ml-4 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>{children}</ol>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <span className={`text-xs mt-2 block ${message.role === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                {new Date(message.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="flex-shrink-0 bg-amber-100 rounded-full p-1 shadow-lg border-2 border-amber-300">
              <img 
                src={mood.image} 
                alt="Don Pippo" 
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <div className="bg-white border-2 border-amber-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader className="h-5 w-5 animate-spin text-amber-600" />
                <span className="text-gray-600 italic">Don Pippo está pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-6 py-2">
          <div className="bg-gray-100 rounded-lg p-3 inline-flex items-center gap-3">
            <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
            <button
              onClick={removeImage}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Adjuntar imagen"
          >
            <Image className="h-5 w-5 text-gray-600" />
          </button>

          {/* Botón de reconocimiento de voz */}
          {recognitionRef.current && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-3 rounded-lg transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg' 
                  : 'bg-amber-100 hover:bg-amber-200'
              }`}
              title={isListening ? "Detener grabación" : "Grabar con voz"}
              disabled={loading}
            >
              {isListening ? (
                <MicOff className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-amber-600" />
              )}
            </button>
          )}

          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder={isListening ? "🎤 Escuchando... habla ahora" : "Pregúntale a Don Pippo... escribe o usa el micrófono 🎤"}
              className="input-field resize-none"
              rows="2"
              disabled={isListening}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isListening ? (
                <span className="text-red-600 font-semibold">🔴 Grabando... Habla ahora</span>
              ) : (
                "💡 Presiona Enter para enviar, Shift + Enter para nueva línea, o usa el micrófono 🎤"
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || (!inputMessage.trim() && !selectedImage)}
            className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Juego de Don Pippo */}
      {showPippoGame && (
        <DonPippoGame 
          student={student}
          onClose={() => setShowPippoGame(false)}
        />
      )}
    </div>
  )
}

export default Chat

