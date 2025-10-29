from pydantic import BaseModel, EmailStr
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime

# Student Schemas (definidos primero para las referencias)
class StudentBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "student"  # "student" o "teacher"
    education_level: Optional[str] = None
    subjects_of_interest: Optional[List[str]] = []

class StudentCreate(StudentBase):
    password: str  # Contraseña en texto plano (se encriptará)
    class_code: Optional[str] = None  # Código de clase para unirse (solo estudiantes)

class StudentLogin(BaseModel):
    email: EmailStr
    password: str

class StudentResponse(StudentBase):
    id: int
    class_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Class Schemas
class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    code: str
    teacher_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ClassWithStudentsResponse(ClassResponse):
    students: List[StudentResponse] = []
    
    class Config:
        from_attributes = True

class StudentWithClassResponse(StudentResponse):
    enrolled_class: Optional[ClassResponse] = None
    
    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    content: str
    image_url: Optional[str] = None

class MessageCreate(MessageBase):
    role: str = "user"

class MessageResponse(MessageBase):
    id: int
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Conversation Schemas
class ConversationBase(BaseModel):
    title: Optional[str] = "Nueva conversación"

class ConversationCreate(ConversationBase):
    student_id: int

class ConversationResponse(ConversationBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True

# Chat Request/Response
class ChatRequest(BaseModel):
    student_id: int
    conversation_id: Optional[int] = None
    message: str
    image_data: Optional[str] = None  # Base64 encoded image

class ChatResponse(BaseModel):
    conversation_id: int
    message: MessageResponse
    assistant_response: MessageResponse

# Quiz Schemas
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int  # índice de la respuesta correcta
    explanation: str

class QuizCreate(BaseModel):
    student_id: int
    subject: str
    topic: str
    num_questions: int = 5
    difficulty: str = "medio"

class QuizResponse(BaseModel):
    id: int
    student_id: int
    title: str
    subject: str
    questions: List[QuizQuestion]
    score: Optional[float] = None
    completed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Study Card Schemas
class StudyCardBase(BaseModel):
    subject: str
    question: str
    answer: str
    difficulty: str = "medio"

class StudyCardCreate(StudyCardBase):
    student_id: int

class StudyCardResponse(StudyCardBase):
    id: int
    student_id: int
    times_reviewed: int
    times_correct: int
    created_at: datetime
    last_reviewed: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Progress Schemas
class ProgressResponse(BaseModel):
    id: int
    student_id: int
    subject: str
    topic: str
    confidence_level: float
    questions_asked: int
    exercises_completed: int
    last_activity: datetime
    
    class Config:
        from_attributes = True

# Bulk Study Cards Generation
class GenerateCardsRequest(BaseModel):
    student_id: int
    subject: str
    content: str  # Texto de apuntes o tema
    num_cards: int = 10

# Document Schemas
class DocumentBase(BaseModel):
    title: str
    subject: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    student_id: int
    file_type: str
    word_count: int
    created_at: datetime
    content: Optional[str] = None  # Se puede incluir o no según la necesidad
    
    class Config:
        from_attributes = True

