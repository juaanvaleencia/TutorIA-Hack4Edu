from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import base64
from datetime import datetime
import json

from database import engine, get_db, Base
from sqlalchemy import text
import models
import schemas
from services.ai_service import AIService
from services.ocr_service import OCRService
from services.quiz_service import QuizService
from services.games_service import GamesService
from services.document_service import DocumentService
from services.auth_service import AuthService

# Cargar variables de entorno
load_dotenv()

# Crear tablas y aplicar pequeñas migraciones seguras (SQLite)
Base.metadata.create_all(bind=engine)

def _ensure_schema_updates():
    """Aplica migraciones mínimas si faltan columnas en SQLite.
    Evita depender de scripts externos en entornos locales.
    """
    try:
        with engine.connect() as conn:
            # Comprobar columnas de documents
            result = conn.exec_driver_sql("PRAGMA table_info(documents)").fetchall()
            cols = [row[1] for row in result]  # segundo campo es el nombre
            if 'is_shared' not in cols:
                conn.exec_driver_sql("ALTER TABLE documents ADD COLUMN is_shared BOOLEAN DEFAULT 0")
                conn.commit()
    except Exception as e:
        print(f"[WARN] Schema update skipped: {e}")

_ensure_schema_updates()

# Crear aplicación FastAPI
app = FastAPI(
    title="TutorIA API",
    description="API para tutor personal con IA",
    version="1.0.0"
)

# Configurar CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Manejador de excepciones global para asegurar headers CORS
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    import traceback
    
    print(f"Error no manejado: {exc}")
    traceback.print_exc()
    
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error interno del servidor: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origins[0] if origins else "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Crear directorio para uploads si no existe
os.makedirs("uploads", exist_ok=True)

# ============= MODELOS PYDANTIC =============

class GameRequest(BaseModel):
    student_id: int
    subject: str
    topic: str

class DemoGameRequest(BaseModel):
    student_id: int

# ============= ENDPOINTS DE AUTENTICACIÓN =============

@app.post("/api/auth/register", response_model=schemas.StudentResponse)
async def register(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    """Registra un nuevo estudiante o profesor."""
    # Verificar si el email ya existe
    existing = db.query(models.Student).filter(models.Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Este email ya está registrado. Por favor, inicia sesión.")
    
    # Encriptar contraseña
    hashed_password = AuthService.hash_password(student.password)
    
    # Verificar y obtener clase si se proporcionó código
    class_id = None
    if student.class_code and student.role == "student":
        class_obj = db.query(models.Class).filter(models.Class.code == student.class_code).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Código de clase no válido")
        class_id = class_obj.id
    
    # Crear estudiante/profesor (sin incluir la contraseña y class_code)
    student_data = student.model_dump(exclude={'password', 'class_code'})
    db_student = models.Student(
        **student_data,
        hashed_password=hashed_password,
        class_id=class_id
    )
    
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.post("/api/auth/login", response_model=schemas.StudentResponse)
async def login(credentials: schemas.StudentLogin, db: Session = Depends(get_db)):
    """Inicia sesión de un estudiante."""
    # Buscar estudiante por email
    student = db.query(models.Student).filter(models.Student.email == credentials.email).first()
    
    if not student:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    # Verificar contraseña
    if not AuthService.verify_password(credentials.password, student.hashed_password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    return student

# ============= ENDPOINTS DE ESTUDIANTES =============

@app.get("/api/students/{student_id}", response_model=schemas.StudentResponse)
async def get_student(student_id: int, db: Session = Depends(get_db)):
    """Obtiene información de un estudiante."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return student

@app.get("/api/students", response_model=List[schemas.StudentResponse])
async def list_students(db: Session = Depends(get_db)):
    """Lista todos los estudiantes."""
    return db.query(models.Student).all()

# ============= ENDPOINTS DE CLASES =============

@app.post("/api/classes", response_model=schemas.ClassResponse)
async def create_class(class_data: schemas.ClassCreate, teacher_id: int, db: Session = Depends(get_db)):
    """Crea una nueva clase (solo profesores)."""
    # Verificar que el usuario es profesor
    teacher = db.query(models.Student).filter(models.Student.id == teacher_id).first()
    if not teacher or teacher.role != "teacher":
        raise HTTPException(status_code=403, detail="Solo los profesores pueden crear clases")
    
    # Generar código único de 8 caracteres
    import random
    import string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # Asegurar que el código sea único
    while db.query(models.Class).filter(models.Class.code == code).first():
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # Crear clase
    db_class = models.Class(
        name=class_data.name,
        description=class_data.description,
        code=code,
        teacher_id=teacher_id
    )
    
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@app.get("/api/classes/teacher/{teacher_id}", response_model=List[schemas.ClassWithStudentsResponse])
async def get_teacher_classes(teacher_id: int, db: Session = Depends(get_db)):
    """Obtiene todas las clases de un profesor con sus estudiantes."""
    teacher = db.query(models.Student).filter(models.Student.id == teacher_id).first()
    if not teacher or teacher.role != "teacher":
        raise HTTPException(status_code=403, detail="Solo los profesores tienen acceso a esta función")
    
    classes = db.query(models.Class).filter(models.Class.teacher_id == teacher_id).all()
    return classes

@app.get("/api/classes/{class_id}/students", response_model=List[schemas.StudentResponse])
async def get_class_students(class_id: int, teacher_id: int, db: Session = Depends(get_db)):
    """Obtiene todos los estudiantes de una clase."""
    # Verificar que la clase existe y pertenece al profesor
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    
    if class_obj.teacher_id != teacher_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta clase")
    
    students = db.query(models.Student).filter(
        models.Student.class_id == class_id,
        models.Student.role == "student"
    ).all()
    return students

@app.get("/api/classes/{class_id}/student/{student_id}/progress")
async def get_student_progress_in_class(
    class_id: int, 
    student_id: int, 
    teacher_id: int, 
    db: Session = Depends(get_db)
):
    """Obtiene el progreso detallado de un estudiante (solo para el profesor de la clase)."""
    try:
        # Verificar que la clase existe y pertenece al profesor
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Clase no encontrada")
        
        if class_obj.teacher_id != teacher_id:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta clase")
        
        # Verificar que el estudiante pertenece a la clase
        student = db.query(models.Student).filter(
            models.Student.id == student_id,
            models.Student.class_id == class_id
        ).first()
        
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado en esta clase")
        
        # Obtener estadísticas del estudiante con manejo de errores
        try:
            total_conversations = db.query(models.Conversation).filter(
                models.Conversation.student_id == student_id
            ).count() or 0
        except Exception:
            total_conversations = 0
        
        try:
            total_messages = db.query(models.Message).join(models.Conversation).filter(
                models.Conversation.student_id == student_id,
                models.Message.role == "user"
            ).count() or 0
        except Exception:
            total_messages = 0
        
        try:
            quizzes_completed = db.query(models.Quiz).filter(
                models.Quiz.student_id == student_id,
                models.Quiz.completed == True
            ).count() or 0
        except Exception:
            quizzes_completed = 0
        
        try:
            quizzes = db.query(models.Quiz).filter(
                models.Quiz.student_id == student_id,
                models.Quiz.completed == True
            ).all()
            avg_score = sum([q.score for q in quizzes if q.score is not None]) / len(quizzes) if quizzes else 0.0
        except Exception:
            avg_score = 0.0
        
        try:
            study_cards_created = db.query(models.StudyCard).filter(
                models.StudyCard.student_id == student_id
            ).count() or 0
        except Exception:
            study_cards_created = 0
        
        try:
            documents_uploaded = db.query(models.Document).filter(
                models.Document.student_id == student_id
            ).count() or 0
        except Exception as e:
            print(f"Error contando documentos: {e}")
            documents_uploaded = 0
        
        return {
            "total_conversations": total_conversations,
            "total_questions": total_messages,
            "quizzes_completed": quizzes_completed,
            "average_quiz_score": round(avg_score, 2) if avg_score else 0.0,
            "study_cards_created": study_cards_created,
            "documents_uploaded": documents_uploaded,
            "recent_activity": []
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_student_progress_in_class: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener progreso: {str(e)}")

@app.delete("/api/classes/{class_id}")
async def delete_class(class_id: int, teacher_id: int, db: Session = Depends(get_db)):
    """Elimina una clase (solo el profesor propietario)."""
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    
    if class_obj.teacher_id != teacher_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta clase")
    
    # Desvincular estudiantes de la clase
    db.query(models.Student).filter(models.Student.class_id == class_id).update({"class_id": None})
    
    db.delete(class_obj)
    db.commit()
    return {"message": "Clase eliminada correctamente"}

# ============= ENDPOINTS DE CHAT =============

@app.post("/api/chat", response_model=schemas.ChatResponse)
async def chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    """Procesa un mensaje de chat con la IA."""
    # Obtener estudiante
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Obtener o crear conversación
    if request.conversation_id:
        conversation = db.query(models.Conversation).filter(
            models.Conversation.id == request.conversation_id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
    else:
        # Crear nueva conversación
        conversation = models.Conversation(
            student_id=request.student_id,
            title=request.message[:50] + "..." if len(request.message) > 50 else request.message
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Procesar imagen si existe
    image_url = None
    if request.image_data:
        # Si es base64, convertir al formato correcto
        if not request.image_data.startswith("data:image"):
            image_url = f"data:image/jpeg;base64,{request.image_data}"
        else:
            image_url = request.image_data
    
    # Guardar mensaje del usuario
    user_message = models.Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
        image_url=image_url
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Obtener historial de mensajes
    previous_messages = db.query(models.Message).filter(
        models.Message.conversation_id == conversation.id
    ).order_by(models.Message.created_at).all()
    
    # Preparar mensajes para la IA (limitar a últimos 10 para no exceder tokens)
    messages_for_ai = [
        {"role": msg.role, "content": msg.content} 
        for msg in previous_messages[-10:]
    ]
    
    # Obtener respuesta de la IA
    ai_response = await AIService.chat(
        messages=messages_for_ai,
        education_level=student.education_level or "secundaria",
        image_url=image_url
    )
    
    # Guardar respuesta de la IA
    assistant_message = models.Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response
    )
    db.add(assistant_message)
    
    # Actualizar timestamp de conversación
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(assistant_message)
    
    return schemas.ChatResponse(
        conversation_id=conversation.id,
        message=user_message,
        assistant_response=assistant_message
    )

@app.get("/api/conversations/{student_id}", response_model=List[schemas.ConversationResponse])
async def get_conversations(student_id: int, db: Session = Depends(get_db)):
    """Obtiene todas las conversaciones de un estudiante."""
    conversations = db.query(models.Conversation).filter(
        models.Conversation.student_id == student_id
    ).order_by(models.Conversation.updated_at.desc()).all()
    return conversations

@app.get("/api/conversations/{conversation_id}/messages", response_model=List[schemas.MessageResponse])
async def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    """Obtiene todos los mensajes de una conversación."""
    messages = db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id
    ).order_by(models.Message.created_at).all()
    return messages

# ============= ENDPOINTS DE OCR / IMÁGENES =============

@app.post("/api/ocr/analyze")
async def analyze_image(
    student_id: int = Form(...),
    image: UploadFile = File(...),
    context: str = Form(""),
    db: Session = Depends(get_db)
):
    """Analiza una imagen subida (ejercicio o apuntes)."""
    # Verificar estudiante
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Leer imagen y convertir a base64
    image_data = await image.read()
    base64_image = base64.b64encode(image_data).decode('utf-8')
    image_url = f"data:image/jpeg;base64,{base64_image}"
    
    # Procesar con OCR
    result = await OCRService.process_image(image_url, context)
    
    return {
        "success": True,
        "analysis": result
    }

@app.post("/api/ocr/exercise")
async def analyze_exercise(
    student_id: int = Form(...),
    image: UploadFile = File(...),
    subject: str = Form(None),
    db: Session = Depends(get_db)
):
    """Analiza un ejercicio en una imagen y proporciona solución paso a paso."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    image_data = await image.read()
    base64_image = base64.b64encode(image_data).decode('utf-8')
    
    result = await OCRService.analyze_exercise(base64_image, subject)
    
    return result

# ============= ENDPOINTS DE QUIZZES =============

@app.post("/api/quiz/generate", response_model=schemas.QuizResponse)
async def generate_quiz(request: schemas.QuizCreate, db: Session = Depends(get_db)):
    """Genera un nuevo quiz."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Generar preguntas con IA
    questions = await QuizService.generate_quiz(
        subject=request.subject,
        topic=request.topic,
        num_questions=request.num_questions,
        difficulty=request.difficulty,
        education_level=student.education_level or "secundaria"
    )
    
    if not questions:
        raise HTTPException(status_code=500, detail="No se pudieron generar las preguntas")
    
    # Crear quiz en BD
    quiz = models.Quiz(
        student_id=request.student_id,
        title=f"Quiz de {request.subject}: {request.topic}",
        subject=request.subject,
        questions=questions,
        completed=False
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    
    return quiz

@app.post("/api/quiz/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: int,
    answers: List[int],
    db: Session = Depends(get_db)
):
    """Envía respuestas de un quiz y calcula puntuación."""
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz no encontrado")
    
    if quiz.completed:
        raise HTTPException(status_code=400, detail="Quiz ya completado")
    
    # Calcular puntuación
    score = QuizService.calculate_score(quiz.questions, answers)
    
    # Actualizar quiz
    quiz.score = score
    quiz.completed = True
    quiz.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(quiz)
    
    return {
        "quiz_id": quiz.id,
        "score": score,
        "total_questions": len(quiz.questions),
        "correct_answers": int(score * len(quiz.questions) / 100)
    }

@app.get("/api/quiz/{student_id}/history", response_model=List[schemas.QuizResponse])
async def get_quiz_history(student_id: int, db: Session = Depends(get_db)):
    """Obtiene historial de quizzes de un estudiante."""
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.student_id == student_id
    ).order_by(models.Quiz.created_at.desc()).all()
    return quizzes

# ============= ENDPOINTS DE JUEGOS =============

@app.post("/api/games/pasapalabra")
async def generate_pasapalabra(
    request: GameRequest,
    db: Session = Depends(get_db)
):
    """Genera un juego de Pasapalabra."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    game_data = await GamesService.generate_pasapalabra(
        subject=request.subject,
        topic=request.topic,
        education_level=student.education_level or "secundaria"
    )
    
    if not game_data.get("letters"):
        raise HTTPException(status_code=500, detail="No se pudo generar el Pasapalabra")
    
    return {
        "success": True,
        "game": "pasapalabra",
        "data": game_data
    }

@app.post("/api/games/atrapa-millon")
async def generate_atrapa_millon(
    request: GameRequest,
    db: Session = Depends(get_db)
):
    """Genera un juego de Atrapa un Millón."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    game_data = await GamesService.generate_atrapa_millon(
        subject=request.subject,
        topic=request.topic,
        education_level=student.education_level or "secundaria"
    )
    
    if not game_data.get("questions"):
        raise HTTPException(status_code=500, detail="No se pudo generar Atrapa un Millón")
    
    return {
        "success": True,
        "game": "atrapa-millon",
        "data": game_data
    }

# ============= ENDPOINTS DE JUEGOS DEMO (SIN IA) =============

@app.post("/api/games/pasapalabra-demo")
async def pasapalabra_demo(request: DemoGameRequest, db: Session = Depends(get_db)):
    """Pasapalabra de demostración con datos predefinidos."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    demo_data = {
        "letters": [
            {"letter": "A", "definition": "Elemento químico con símbolo Au", "answer": "Oro", "type": "starts"},
            {"letter": "B", "definition": "Ciencia que estudia los seres vivos", "answer": "Biología", "type": "starts"},
            {"letter": "C", "definition": "Ciudad capital de España", "answer": "Madrid", "type": "contains"},
            {"letter": "D", "definition": "Operación matemática inversa a la multiplicación", "answer": "División", "type": "starts"},
            {"letter": "E", "definition": "Continente donde está España", "answer": "Europa", "type": "starts"},
            {"letter": "F", "definition": "Proceso por el que las plantas producen su alimento", "answer": "Fotosíntesis", "type": "starts"},
            {"letter": "G", "definition": "Fuerza que atrae los objetos hacia la Tierra", "answer": "Gravedad", "type": "starts"},
            {"letter": "H", "definition": "Elemento químico más abundante del universo", "answer": "Hidrógeno", "type": "starts"},
            {"letter": "I", "definition": "Continente del subcontinente indio", "answer": "Asia", "type": "contains"},
            {"letter": "J", "definition": "Deporte olímpico que usa un tatami", "answer": "Judo", "type": "starts"},
            {"letter": "K", "definition": "Unidad de medida de temperatura", "answer": "Kelvin", "type": "starts"},
            {"letter": "L", "definition": "Idioma que se habla en Brasil", "answer": "Portugués", "type": "contains"},
            {"letter": "M", "definition": "Órgano que bombea la sangre", "answer": "Corazón", "type": "contains"},
            {"letter": "N", "definition": "Gas más abundante en la atmósfera", "answer": "Nitrógeno", "type": "starts"},
            {"letter": "Ñ", "definition": "Séptimo mes del año", "answer": "Julio", "type": "contains"},
            {"letter": "O", "definition": "Elemento necesario para respirar", "answer": "Oxígeno", "type": "starts"},
            {"letter": "P", "definition": "País con forma de bota en Europa", "answer": "Italia", "type": "contains"},
            {"letter": "Q", "definition": "Ciencia que estudia las sustancias", "answer": "Química", "type": "starts"},
            {"letter": "R", "definition": "Órgano que filtra la sangre", "answer": "Riñón", "type": "starts"},
            {"letter": "S", "definition": "Estrella central de nuestro sistema planetario", "answer": "Sol", "type": "starts"},
            {"letter": "T", "definition": "Planeta con anillos", "answer": "Saturno", "type": "contains"},
            {"letter": "U", "definition": "Séptimo planeta del sistema solar", "answer": "Urano", "type": "starts"},
            {"letter": "V", "definition": "Planeta más cercano al Sol", "answer": "Mercurio", "type": "contains"},
            {"letter": "W", "definition": "Unidad de potencia eléctrica", "answer": "Watt", "type": "starts"},
            {"letter": "X", "definition": "Instrumento musical de percusión", "answer": "Xilófono", "type": "starts"},
            {"letter": "Y", "definition": "Metal precioso blanco", "answer": "Plata", "type": "contains"},
            {"letter": "Z", "definition": "Ciencia que estudia los animales", "answer": "Zoología", "type": "starts"}
        ]
    }
    
    return {
        "success": True,
        "game": "pasapalabra",
        "data": demo_data
    }

@app.post("/api/games/atrapa-millon-demo")
async def atrapa_millon_demo(request: DemoGameRequest, db: Session = Depends(get_db)):
    """Atrapa un Millón de demostración con datos predefinidos."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    demo_data = {
        "questions": [
            {"number": 1, "difficulty": "facil", "question": "¿Cuál es la capital de España?", "options": ["Madrid", "Barcelona", "Valencia", "Sevilla"], "correct_answer": 0},
            {"number": 2, "difficulty": "facil", "question": "¿Cuántos continentes hay en el mundo?", "options": ["5", "6", "7", "8"], "correct_answer": 2},
            {"number": 3, "difficulty": "facil", "question": "¿Qué planeta es conocido como el planeta rojo?", "options": ["Venus", "Marte", "Júpiter", "Saturno"], "correct_answer": 1},
            {"number": 4, "difficulty": "medio", "question": "¿Cuánto es 12 x 12?", "options": ["120", "124", "144", "156"], "correct_answer": 2},
            {"number": 5, "difficulty": "medio", "question": "¿Quién pintó la Mona Lisa?", "options": ["Picasso", "Da Vinci", "Van Gogh", "Dalí"], "correct_answer": 1},
            {"number": 6, "difficulty": "medio", "question": "¿En qué año llegó el hombre a la Luna?", "options": ["1965", "1967", "1969", "1971"], "correct_answer": 2},
            {"number": 7, "difficulty": "medio", "question": "¿Cuál es el río más largo del mundo?", "options": ["Nilo", "Amazonas", "Yangtsé", "Misisipi"], "correct_answer": 1},
            {"number": 8, "difficulty": "dificil", "question": "¿Qué elemento químico tiene el símbolo 'Au'?", "options": ["Plata", "Oro", "Platino", "Aluminio"], "correct_answer": 1},
            {"number": 9, "difficulty": "dificil", "question": "¿Cuántos huesos tiene el cuerpo humano adulto?", "options": ["186", "206", "226", "246"], "correct_answer": 1},
            {"number": 10, "difficulty": "dificil", "question": "¿En qué año cayó el Muro de Berlín?", "options": ["1987", "1988", "1989", "1990"], "correct_answer": 2}
        ]
    }
    
    return {
        "success": True,
        "game": "atrapa-millon",
        "data": demo_data
    }

@app.post("/api/games/escape-room")
async def generate_escape_room(
    request: GameRequest,
    db: Session = Depends(get_db)
):
    """Genera un Escape Room Educativo."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    game_data = await GamesService.generate_escape_room(
        subject=request.subject,
        topic=request.topic,
        education_level=student.education_level or "secundaria"
    )
    
    if not game_data.get("rooms"):
        raise HTTPException(status_code=500, detail="No se pudo generar el Escape Room")
    
    return {
        "success": True,
        "game": "escape-room",
        "data": game_data
    }

@app.post("/api/games/ahorcado")
async def generate_ahorcado(
    request: GameRequest,
    db: Session = Depends(get_db)
):
    """Genera un juego de Ahorcado."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    game_data = await GamesService.generate_ahorcado(
        subject=request.subject,
        topic=request.topic,
        education_level=student.education_level or "secundaria"
    )
    
    if not game_data.get("words"):
        raise HTTPException(status_code=500, detail="No se pudo generar el Ahorcado")
    
    return {
        "success": True,
        "game": "ahorcado",
        "data": game_data
    }

@app.post("/api/games/escape-room-demo")
async def escape_room_demo(request: DemoGameRequest, db: Session = Depends(get_db)):
    """Escape Room de demostración con datos predefinidos."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    demo_data = {
        "title": "El Misterio del Laboratorio Perdido",
        "theme": "Ciencia y Descubrimientos",
        "rooms": [
            {
                "number": 1,
                "name": "La Entrada del Laboratorio",
                "description": "Te encuentras frente a una puerta cerrada con un panel numérico. En la pared hay una nota: 'La contraseña es el número de planetas en el sistema solar'.",
                "enigma": {
                    "type": "pregunta",
                    "question": "¿Cuántos planetas hay en nuestro sistema solar?",
                    "options": ["7", "8", "9", "10"],
                    "answer": "8",
                    "hint": "Plutón ya no se considera un planeta desde 2006"
                }
            },
            {
                "number": 2,
                "name": "El Cuarto de los Elementos",
                "description": "Has entrado en un laboratorio lleno de tubos de ensayo. En el centro hay una tabla periódica incompleta.",
                "enigma": {
                    "type": "pregunta",
                    "question": "¿Qué elemento químico tiene el símbolo 'H' y es el más abundante del universo?",
                    "options": ["Helio", "Hidrógeno", "Hierro", "Hafnio"],
                    "answer": "Hidrógeno",
                    "hint": "Es el elemento más ligero y simple que existe"
                }
            },
            {
                "number": 3,
                "name": "La Biblioteca del Saber",
                "description": "Estás rodeado de libros antiguos. Uno de ellos brilla con luz propia y tiene un acertijo matemático.",
                "enigma": {
                    "type": "calculo",
                    "question": "Si la velocidad de la luz es aproximadamente 300,000 km/s, ¿cuántos kilómetros recorre la luz en 2 segundos?",
                    "options": ["150,000 km", "300,000 km", "600,000 km", "900,000 km"],
                    "answer": "600,000 km",
                    "hint": "Multiplica la velocidad por el tiempo"
                }
            },
            {
                "number": 4,
                "name": "El Observatorio",
                "description": "Has llegado a una sala con un telescopio gigante. Las estrellas forman constelaciones en el techo.",
                "enigma": {
                    "type": "pregunta",
                    "question": "¿Cuál es la estrella más cercana a la Tierra (después del Sol)?",
                    "options": ["Sirio", "Betelgeuse", "Próxima Centauri", "Vega"],
                    "answer": "Próxima Centauri",
                    "hint": "Se encuentra en el sistema Alpha Centauri"
                }
            },
            {
                "number": 5,
                "name": "La Cámara del Tiempo",
                "description": "La sala final. Un reloj gigante marca la hora y pide resolver el enigma final para escapar.",
                "enigma": {
                    "type": "acertijo",
                    "question": "Einstein descubrió que E=mc². Si 'c' representa la velocidad de la luz, ¿qué representan 'E' y 'm'?",
                    "options": ["Energía y Masa", "Electricidad y Materia", "Espacio y Movimiento", "Electrón y Molécula"],
                    "answer": "Energía y Masa",
                    "hint": "Es la ecuación más famosa de la física"
                }
            }
        ]
    }
    
    return {
        "success": True,
        "game": "escape-room",
        "data": demo_data
    }

@app.post("/api/games/ahorcado-demo")
async def ahorcado_demo(request: DemoGameRequest, db: Session = Depends(get_db)):
    """Ahorcado de demostración con datos predefinidos."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    demo_data = {
        "words": [
            {"word": "GRAVEDAD", "hint": "Fuerza que atrae los objetos hacia la Tierra", "category": "Física", "difficulty": "facil"},
            {"word": "MOLECULA", "hint": "Grupo de átomos unidos por enlaces químicos", "category": "Química", "difficulty": "facil"},
            {"word": "CELULA", "hint": "Unidad básica de la vida", "category": "Biología", "difficulty": "facil"},
            {"word": "TRIANGULO", "hint": "Polígono de tres lados", "category": "Geometría", "difficulty": "media"},
            {"word": "VOLUMEN", "hint": "Espacio que ocupa un objeto", "category": "Física", "difficulty": "media"},
            {"word": "ECUACION", "hint": "Igualdad matemática con incógnitas", "category": "Matemáticas", "difficulty": "media"},
            {"word": "FOTOSINTESIS", "hint": "Proceso por el que las plantas producen su alimento", "category": "Biología", "difficulty": "media"},
            {"word": "MAGNETISMO", "hint": "Propiedad de atraer o repeler objetos metálicos", "category": "Física", "difficulty": "dificil"},
            {"word": "CROMOSOMA", "hint": "Estructura que contiene el material genético", "category": "Biología", "difficulty": "dificil"},
            {"word": "PITAGORAS", "hint": "Matemático griego famoso por su teorema sobre triángulos", "category": "Matemáticas", "difficulty": "dificil"}
        ]
    }
    
    return {
        "success": True,
        "game": "ahorcado",
        "data": demo_data
    }

# ============= ENDPOINTS DE TARJETAS DE ESTUDIO =============

@app.post("/api/cards/generate")
async def generate_study_cards(request: schemas.GenerateCardsRequest, db: Session = Depends(get_db)):
    """Genera tarjetas de estudio a partir de contenido."""
    student = db.query(models.Student).filter(models.Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Generar tarjetas con IA
    cards = await QuizService.generate_study_cards(
        subject=request.subject,
        content=request.content,
        num_cards=request.num_cards,
        education_level=student.education_level or "secundaria"
    )
    
    if not cards:
        raise HTTPException(status_code=500, detail="No se pudieron generar las tarjetas")
    
    # Guardar tarjetas en BD
    db_cards = []
    for card in cards:
        db_card = models.StudyCard(
            student_id=request.student_id,
            subject=request.subject,
            question=card["question"],
            answer=card["answer"],
            difficulty=card.get("difficulty", "medio")
        )
        db.add(db_card)
        db_cards.append(db_card)
    
    db.commit()
    
    return {
        "success": True,
        "cards_created": len(db_cards),
        "cards": [schemas.StudyCardResponse.from_orm(card) for card in db_cards]
    }

@app.get("/api/cards/{student_id}", response_model=List[schemas.StudyCardResponse])
async def get_study_cards(
    student_id: int,
    subject: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtiene tarjetas de estudio de un estudiante."""
    query = db.query(models.StudyCard).filter(models.StudyCard.student_id == student_id)
    
    if subject:
        query = query.filter(models.StudyCard.subject == subject)
    
    cards = query.order_by(models.StudyCard.created_at.desc()).all()
    return cards

@app.post("/api/cards/{card_id}/review")
async def review_card(
    card_id: int,
    correct: bool,
    db: Session = Depends(get_db)
):
    """Registra una revisión de una tarjeta."""
    card = db.query(models.StudyCard).filter(models.StudyCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    
    card.times_reviewed += 1
    if correct:
        card.times_correct += 1
    card.last_reviewed = datetime.utcnow()
    
    db.commit()
    db.refresh(card)
    
    return {
        "success": True,
        "card_id": card.id,
        "times_reviewed": card.times_reviewed,
        "times_correct": card.times_correct,
        "accuracy": (card.times_correct / card.times_reviewed * 100) if card.times_reviewed > 0 else 0
    }

# ============= ENDPOINTS DE PROGRESO =============

@app.get("/api/progress/{student_id}", response_model=List[schemas.ProgressResponse])
async def get_progress(student_id: int, db: Session = Depends(get_db)):
    """Obtiene el progreso de un estudiante."""
    progress = db.query(models.Progress).filter(
        models.Progress.student_id == student_id
    ).order_by(models.Progress.last_activity.desc()).all()
    return progress

@app.get("/api/stats/{student_id}")
async def get_student_stats(student_id: int, db: Session = Depends(get_db)):
    """Obtiene estadísticas generales de un estudiante."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Contar conversaciones
    total_conversations = db.query(models.Conversation).filter(
        models.Conversation.student_id == student_id
    ).count()
    
    # Contar mensajes
    total_messages = db.query(models.Message).join(models.Conversation).filter(
        models.Conversation.student_id == student_id,
        models.Message.role == "user"
    ).count()
    
    # Contar quizzes completados
    quizzes_completed = db.query(models.Quiz).filter(
        models.Quiz.student_id == student_id,
        models.Quiz.completed == True
    ).count()
    
    # Promedio de puntuación en quizzes
    completed_quizzes = db.query(models.Quiz).filter(
        models.Quiz.student_id == student_id,
        models.Quiz.completed == True
    ).all()
    
    avg_score = sum(q.score for q in completed_quizzes) / len(completed_quizzes) if completed_quizzes else 0
    
    # Contar tarjetas
    total_cards = db.query(models.StudyCard).filter(
        models.StudyCard.student_id == student_id
    ).count()
    
    # Contar juegos completados
    games_completed = db.query(models.GameCompletion).filter(
        models.GameCompletion.student_id == student_id
    ).count()
    
    # Contar por tipo de juego
    pasapalabra_completed = db.query(models.GameCompletion).filter(
        models.GameCompletion.student_id == student_id,
        models.GameCompletion.game_type == "pasapalabra"
    ).count()
    
    atrapa_millon_completed = db.query(models.GameCompletion).filter(
        models.GameCompletion.student_id == student_id,
        models.GameCompletion.game_type == "atrapa-millon"
    ).count()
    
    escape_room_completed = db.query(models.GameCompletion).filter(
        models.GameCompletion.student_id == student_id,
        models.GameCompletion.game_type == "escape-room"
    ).count()
    
    ahorcado_completed = db.query(models.GameCompletion).filter(
        models.GameCompletion.student_id == student_id,
        models.GameCompletion.game_type == "ahorcado"
    ).count()
    
    return {
        "student_id": student_id,
        "student_name": student.name,
        "education_level": student.education_level,
        "total_conversations": total_conversations,
        "total_questions": total_messages,
        "quizzes_completed": quizzes_completed,
        "average_quiz_score": round(avg_score, 2),
        "study_cards_created": total_cards,
        "games_completed": games_completed,
        "games_by_type": {
            "pasapalabra": pasapalabra_completed,
            "atrapa-millon": atrapa_millon_completed,
            "escape-room": escape_room_completed,
            "ahorcado": ahorcado_completed
        },
        "member_since": student.created_at
    }

# ============= ENDPOINTS DE DOCUMENTOS =============

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject: str = Form(None),
    student_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """Sube un documento y extrae su contenido."""
    # Verificar que el estudiante existe
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Validar archivo
    file_size = 0
    content_bytes = await file.read()
    file_size = len(content_bytes)
    await file.seek(0)  # Resetear el puntero del archivo
    
    is_valid, error_msg = DocumentService.validate_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Guardar archivo
    DocumentService.ensure_upload_dir()
    file_ext = os.path.splitext(file.filename)[1].lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{student_id}_{timestamp}{file_ext}"
    file_path = os.path.join(DocumentService.UPLOAD_DIR, safe_filename)
    
    try:
        # Guardar archivo en disco
        with open(file_path, "wb") as buffer:
            buffer.write(content_bytes)
        
        # Extraer texto
        text_content = DocumentService.extract_text(file_path, file_ext)
        word_count = DocumentService.count_words(text_content)
        
        # Crear registro en base de datos
        document = models.Document(
            student_id=student_id,
            title=title,
            subject=subject,
            file_type=file_ext.replace('.', ''),
            file_path=file_path,
            content=text_content,
            word_count=word_count
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return {
            "success": True,
            "document": {
                "id": document.id,
                "title": document.title,
                "subject": document.subject,
                "file_type": document.file_type,
                "word_count": document.word_count,
                "created_at": document.created_at
            }
        }
        
    except Exception as e:
        # Si algo falla, eliminar el archivo guardado
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error al procesar documento: {str(e)}")

@app.get("/api/documents/{student_id}")
async def list_documents(student_id: int, db: Session = Depends(get_db)):
    """Lista todos los documentos de un estudiante."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    documents = db.query(models.Document).filter(
        models.Document.student_id == student_id
    ).order_by(models.Document.created_at.desc()).all()
    
    return {
        "success": True,
        "documents": [
            {
                "id": doc.id,
                "title": doc.title,
                "subject": doc.subject,
                "file_type": doc.file_type,
                "word_count": doc.word_count,
                "created_at": doc.created_at
            }
            for doc in documents
        ]
    }

@app.get("/api/documents/{student_id}/{document_id}")
async def get_document(student_id: int, document_id: int, db: Session = Depends(get_db)):
    """Obtiene un documento específico con su contenido."""
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.student_id == student_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    return {
        "success": True,
        "document": {
            "id": document.id,
            "title": document.title,
            "subject": document.subject,
            "file_type": document.file_type,
            "word_count": document.word_count,
            "content": document.content,
            "created_at": document.created_at
        }
    }

@app.delete("/api/documents/{student_id}/{document_id}")
async def delete_document(student_id: int, document_id: int, db: Session = Depends(get_db)):
    """Elimina un documento."""
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.student_id == student_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    # Eliminar archivo físico
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as e:
            print(f"Error al eliminar archivo: {e}")
    
    # Eliminar registro de base de datos
    db.delete(document)
    db.commit()
    
    return {
        "success": True,
        "message": "Documento eliminado correctamente"
    }

# ============= DOCUMENTOS COMPARTIDOS =============

@app.patch("/api/documents/{student_id}/{document_id}/share")
async def share_document(student_id: int, document_id: int, share: bool, db: Session = Depends(get_db)):
    """Compartir o descompartir un documento con la clase (solo profesores)."""
    # Verificar que el usuario es profesor
    teacher = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not teacher or teacher.role != "teacher":
        raise HTTPException(status_code=403, detail="Solo los profesores pueden compartir documentos")
    
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.student_id == student_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    document.is_shared = share
    db.commit()
    
    return {
        "success": True,
        "message": f"Documento {'compartido' if share else 'descompartido'} correctamente",
        "is_shared": document.is_shared
    }

@app.get("/api/documents/class/{class_id}/shared")
async def get_shared_documents(class_id: int, db: Session = Depends(get_db)):
    """Obtiene todos los documentos compartidos por el profesor de una clase."""
    # Obtener la clase
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    
    # Obtener documentos compartidos del profesor
    documents = db.query(models.Document).filter(
        models.Document.student_id == class_obj.teacher_id,
        models.Document.is_shared == True
    ).all()
    
    return {
        "success": True,
        "documents": [
            {
                "id": doc.id,
                "title": doc.title,
                "subject": doc.subject,
                "file_type": doc.file_type,
                "word_count": doc.word_count,
                "content": doc.content,
                "created_at": doc.created_at
            }
            for doc in documents
        ]
    }

# ============= ACTIVIDADES =============

class ActivityCreate(BaseModel):
    class_id: int
    teacher_id: int
    title: str
    description: str
    subject: Optional[str] = None
    due_date: Optional[str] = None
    activity_type: str = "exercise"
    content: Optional[dict] = None

class ActivitySubmission(BaseModel):
    activity_id: int
    student_id: int
    content: str

@app.post("/api/activities")
async def create_activity(activity: ActivityCreate, db: Session = Depends(get_db)):
    """Crear una nueva actividad (solo profesores)."""
    # Verificar que el usuario es profesor
    teacher = db.query(models.Student).filter(models.Student.id == activity.teacher_id).first()
    if not teacher or teacher.role != "teacher":
        raise HTTPException(status_code=403, detail="Solo los profesores pueden crear actividades")
    
    # Verificar que el profesor es dueño de la clase
    class_obj = db.query(models.Class).filter(
        models.Class.id == activity.class_id,
        models.Class.teacher_id == activity.teacher_id
    ).first()
    
    if not class_obj:
        raise HTTPException(status_code=404, detail="Clase no encontrada o no eres el profesor")
    
    # Crear actividad
    new_activity = models.Activity(
        class_id=activity.class_id,
        teacher_id=activity.teacher_id,
        title=activity.title,
        description=activity.description,
        subject=activity.subject,
        due_date=datetime.fromisoformat(activity.due_date) if activity.due_date else None,
        activity_type=activity.activity_type,
        content=activity.content
    )
    
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    
    return {
        "success": True,
        "message": "Actividad creada correctamente",
        "activity_id": new_activity.id
    }

@app.get("/api/activities/class/{class_id}")
async def get_activities(class_id: int, student_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Obtiene todas las actividades de una clase."""
    activities = db.query(models.Activity).filter(
        models.Activity.class_id == class_id
    ).all()
    
    result = []
    for activity in activities:
        activity_data = {
            "id": activity.id,
            "title": activity.title,
            "description": activity.description,
            "subject": activity.subject,
            "due_date": activity.due_date,
            "activity_type": activity.activity_type,
            "content": activity.content,
            "created_at": activity.created_at
        }
        
        # Si es un estudiante, agregar su estado de entrega
        if student_id:
            submission = db.query(models.ActivitySubmission).filter(
                models.ActivitySubmission.activity_id == activity.id,
                models.ActivitySubmission.student_id == student_id
            ).first()
            
            activity_data["submission"] = {
                "status": submission.status if submission else "not_submitted",
                "submitted_at": submission.submitted_at if submission else None,
                "score": submission.score if submission else None,
                "feedback": submission.feedback if submission else None
            }
        
        result.append(activity_data)
    
    return {
        "success": True,
        "activities": result
    }

@app.post("/api/activities/submit")
async def submit_activity(submission: ActivitySubmission, db: Session = Depends(get_db)):
    """Enviar o actualizar una entrega de actividad."""
    # Verificar que la actividad existe
    activity = db.query(models.Activity).filter(models.Activity.id == submission.activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    
    # Buscar si ya existe una entrega
    existing_submission = db.query(models.ActivitySubmission).filter(
        models.ActivitySubmission.activity_id == submission.activity_id,
        models.ActivitySubmission.student_id == submission.student_id
    ).first()
    
    if existing_submission:
        # Actualizar entrega existente
        existing_submission.content = submission.content
        existing_submission.status = "submitted"
        existing_submission.submitted_at = datetime.utcnow()
    else:
        # Crear nueva entrega
        new_submission = models.ActivitySubmission(
            activity_id=submission.activity_id,
            student_id=submission.student_id,
            content=submission.content,
            status="submitted"
        )
        db.add(new_submission)
    
    db.commit()
    
    return {
        "success": True,
        "message": "Actividad enviada correctamente"
    }

@app.get("/api/activities/{activity_id}/submissions")
async def get_activity_submissions(activity_id: int, db: Session = Depends(get_db)):
    """Obtiene todas las entregas de una actividad (solo profesores)."""
    submissions = db.query(models.ActivitySubmission).filter(
        models.ActivitySubmission.activity_id == activity_id
    ).all()
    
    result = []
    for submission in submissions:
        student = db.query(models.Student).filter(models.Student.id == submission.student_id).first()
        result.append({
            "id": submission.id,
            "student_id": submission.student_id,
            "student_name": student.name if student else "Desconocido",
            "content": submission.content,
            "status": submission.status,
            "score": submission.score,
            "feedback": submission.feedback,
            "submitted_at": submission.submitted_at,
            "graded_at": submission.graded_at
        })
    
    return {
        "success": True,
        "submissions": result
    }

@app.delete("/api/activities/{activity_id}")
async def delete_activity(activity_id: int, teacher_id: int, db: Session = Depends(get_db)):
    """Eliminar una actividad (solo el profesor que la creó)."""
    activity = db.query(models.Activity).filter(
        models.Activity.id == activity_id,
        models.Activity.teacher_id == teacher_id
    ).first()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    
    db.delete(activity)
    db.commit()
    
    return {
        "success": True,
        "message": "Actividad eliminada correctamente"
    }

# ============= HEALTH CHECK =============

@app.get("/")
async def root():
    return {
        "message": "TutorIA API",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ============= GAME COMPLETIONS =============

class GameCompletionRequest(BaseModel):
    student_id: int
    game_type: str  # pasapalabra, atrapa-millon, escape-room, ahorcado
    score: Optional[float] = None
    game_data: Optional[dict] = None

@app.post("/api/games/complete")
async def complete_game(completion: GameCompletionRequest, db: Session = Depends(get_db)):
    """Registra cuando un estudiante completa un juego."""
    try:
        game_completion = models.GameCompletion(
            student_id=completion.student_id,
            game_type=completion.game_type,
            score=completion.score,
            game_data=completion.game_data,
            completed=True
        )
        
        db.add(game_completion)
        db.commit()
        db.refresh(game_completion)
        
        return {
            "success": True,
            "message": "Juego registrado correctamente",
            "completion_id": game_completion.id
        }
    except Exception as e:
        db.rollback()
        print(f"Error registrando juego completado: {e}")
        raise HTTPException(status_code=500, detail=f"Error al registrar el juego: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

