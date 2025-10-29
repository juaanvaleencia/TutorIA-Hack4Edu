from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)  # Código único de clase
    teacher_id = Column(Integer, ForeignKey("students.id"))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    teacher = relationship("Student", back_populates="classes_teaching", foreign_keys=[teacher_id])
    students = relationship("Student", back_populates="enrolled_class", foreign_keys="Student.class_id")

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)  # Contraseña encriptada
    role = Column(String(20), default="student")  # "student" o "teacher"
    education_level = Column(String(50))  # primaria, secundaria, bachillerato, universidad
    subjects_of_interest = Column(JSON)  # Lista de materias de interés
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)  # Clase a la que pertenece (solo estudiantes)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    conversations = relationship("Conversation", back_populates="student")
    progress = relationship("Progress", back_populates="student")
    quizzes = relationship("Quiz", back_populates="student")
    documents = relationship("Document", back_populates="student", cascade="all, delete-orphan")
    classes_teaching = relationship("Class", back_populates="teacher", foreign_keys="Class.teacher_id")
    enrolled_class = relationship("Class", back_populates="students", foreign_keys=[class_id])

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    title = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    student = relationship("Student", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    role = Column(String(20))  # user, assistant, system
    content = Column(Text, nullable=False)
    image_url = Column(String(500))  # URL o path de imagen si la hay
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relación
    conversation = relationship("Conversation", back_populates="messages")

class Progress(Base):
    __tablename__ = "progress"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject = Column(String(100))
    topic = Column(String(200))
    confidence_level = Column(Float, default=0.0)  # 0.0 a 1.0
    questions_asked = Column(Integer, default=0)
    exercises_completed = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Relación
    student = relationship("Student", back_populates="progress")

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    title = Column(String(200))
    subject = Column(String(100))
    questions = Column(JSON)  # Lista de preguntas con opciones y respuestas
    score = Column(Float)  # Puntuación obtenida
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relación
    student = relationship("Student", back_populates="quizzes")

class StudyCard(Base):
    __tablename__ = "study_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject = Column(String(100))
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    difficulty = Column(String(20))  # facil, medio, dificil
    times_reviewed = Column(Integer, default=0)
    times_correct = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_reviewed = Column(DateTime)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    title = Column(String(200), nullable=False)
    subject = Column(String(100))
    file_type = Column(String(10))  # pdf, docx, txt
    file_path = Column(String(500))  # Ruta donde se guarda el archivo
    content = Column(Text)  # Contenido extraído del archivo
    word_count = Column(Integer, default=0)
    is_shared = Column(Boolean, default=False)  # Si es compartido con la clase (solo profesores)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relación
    student = relationship("Student", back_populates="documents")

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    teacher_id = Column(Integer, ForeignKey("students.id"))
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    subject = Column(String(100))
    due_date = Column(DateTime, nullable=True)
    activity_type = Column(String(50))  # quiz, reading, exercise, project
    content = Column(JSON)  # Contenido específico de la actividad
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    submissions = relationship("ActivitySubmission", back_populates="activity", cascade="all, delete-orphan")

class ActivitySubmission(Base):
    __tablename__ = "activity_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    content = Column(Text)  # Respuesta o contenido enviado
    score = Column(Float, nullable=True)  # Calificación
    feedback = Column(Text, nullable=True)  # Retroalimentación del profesor
    status = Column(String(20), default="pending")  # pending, submitted, graded
    submitted_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime, nullable=True)
    
    # Relaciones
    activity = relationship("Activity", back_populates="submissions")

class GameCompletion(Base):
    __tablename__ = "game_completions"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    game_type = Column(String(50))  # pasapalabra, atrapa-millon, escape-room, ahorcado
    score = Column(Float, nullable=True)  # Puntuación obtenida
    completed = Column(Boolean, default=True)
    completed_at = Column(DateTime, default=datetime.utcnow)
    game_data = Column(JSON, nullable=True)  # Información adicional (puntos, preguntas correctas, etc.)

