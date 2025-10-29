import json
from groq import Groq
import os
from typing import List, Dict

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class QuizService:
    
    @staticmethod
    async def generate_quiz(
        subject: str, 
        topic: str, 
        num_questions: int = 5,
        difficulty: str = "medio",
        education_level: str = "secundaria"
    ) -> List[Dict]:
        """
        Genera un quiz con preguntas de opción múltiple.
        
        Args:
            subject: Materia (ej: matemáticas, historia, biología)
            topic: Tema específico
            num_questions: Número de preguntas a generar
            difficulty: facil, medio, dificil
            education_level: Nivel educativo del estudiante
        
        Returns:
            Lista de preguntas con opciones y respuestas
        """
        try:
            difficulty_desc = {
                "facil": "fáciles, conceptuales y directas",
                "medio": "de dificultad moderada que requieren comprensión",
                "dificil": "desafiantes que requieren análisis profundo"
            }
            
            prompt = f"""Genera {num_questions} preguntas de opción múltiple sobre {topic} en la materia de {subject}.

Nivel educativo: {education_level}
Dificultad: {difficulty} ({difficulty_desc.get(difficulty, 'moderada')})

Requisitos:
- Cada pregunta debe tener 4 opciones (A, B, C, D)
- Solo una opción es correcta
- Las opciones incorrectas deben ser plausibles pero claramente erróneas
- Incluye una explicación breve de por qué la respuesta es correcta
- Las preguntas deben cubrir diferentes aspectos del tema

Formato de respuesta (JSON):
{{
  "questions": [
    {{
      "question": "texto de la pregunta",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "correct_answer": 0,
      "explanation": "explicación de por qué esta opción es correcta"
    }}
  ]
}}

Responde SOLO con el JSON, sin texto adicional."""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            quiz_data = json.loads(content)
            
            return quiz_data.get("questions", [])
            
        except Exception as e:
            print(f"Error generando quiz: {str(e)}")
            return []
    
    @staticmethod
    async def generate_study_cards(
        subject: str,
        content: str,
        num_cards: int = 10,
        education_level: str = "secundaria"
    ) -> List[Dict]:
        """
        Genera tarjetas de estudio tipo Quizlet a partir de contenido.
        
        Args:
            subject: Materia
            content: Contenido de apuntes o tema
            num_cards: Número de tarjetas a generar
            education_level: Nivel educativo
        
        Returns:
            Lista de tarjetas (pregunta/respuesta)
        """
        try:
            prompt = f"""Basándote en el siguiente contenido sobre {subject}, genera {num_cards} tarjetas de estudio.

Nivel educativo: {education_level}

Contenido:
{content[:3000]}  

Requisitos para las tarjetas:
- Cada tarjeta tiene una pregunta (frente) y una respuesta (reverso)
- Las preguntas deben ser claras y específicas
- Las respuestas deben ser concisas pero completas
- Cubre los conceptos más importantes del contenido
- Varía el tipo de preguntas (definiciones, conceptos, aplicaciones, ejemplos)
- Asigna una dificultad a cada tarjeta (facil, medio, dificil)

Formato de respuesta (JSON):
{{
  "cards": [
    {{
      "question": "¿Qué es...?",
      "answer": "respuesta concisa",
      "difficulty": "facil"
    }}
  ]
}}

Responde SOLO con el JSON, sin texto adicional."""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            cards_data = json.loads(content)
            
            return cards_data.get("cards", [])
            
        except Exception as e:
            print(f"Error generando tarjetas: {str(e)}")
            return []
    
    @staticmethod
    def calculate_score(questions: List[Dict], user_answers: List[int]) -> float:
        """
        Calcula la puntuación de un quiz.
        
        Args:
            questions: Lista de preguntas del quiz
            user_answers: Lista de índices de respuestas del usuario
        
        Returns:
            Puntuación en porcentaje (0-100)
        """
        if not questions or not user_answers:
            return 0.0
        
        correct = 0
        total = len(questions)
        
        for i, question in enumerate(questions):
            if i < len(user_answers):
                if user_answers[i] == question.get("correct_answer"):
                    correct += 1
        
        return (correct / total) * 100 if total > 0 else 0.0

