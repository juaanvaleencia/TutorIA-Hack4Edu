import os
from groq import Groq
from typing import List, Dict, Optional
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class AIService:
    
    @staticmethod
    def get_system_prompt(education_level: str = "secundaria") -> str:
        """Genera el prompt del sistema según el nivel educativo."""
        level_prompts = {
            "primaria": "Usa lenguaje muy simple y ejemplos del día a día. Sé especialmente entusiasta y usa muchos ejemplos visuales y comparaciones con cosas que los niños conocen.",
            "secundaria": "Explica conceptos de forma clara pero completa. Usa ejemplos que los jóvenes puedan relacionar con su vida diaria.",
            "bachillerato": "Proporciona explicaciones detalladas cuando sea necesario. Conecta conceptos entre diferentes áreas del conocimiento.",
            "universidad": "Ofrece explicaciones profundas y rigurosas. Incluye referencias académicas cuando sea apropiado."
        }
        
        level_guidance = level_prompts.get(education_level, level_prompts["secundaria"])
        
        return f"""Eres Don Pipo, un profesor virtual amigable, cercano y muy paciente. Tu misión es ayudar a estudiantes de todas las edades a aprender de forma divertida y sin complicaciones.

PERSONALIDAD DE DON PIPO:
- Eres cálido, cercano y siempre optimista
- Hablas de forma clara y natural, como un amigo que enseña
- Evitas términos técnicos innecesarios
- Eres especialmente paciente con quien tiene dificultades
- Usas expresiones amigables como "¡Genial!", "¡Muy bien!", "No te preocupes"
- Te gusta poner ejemplos de la vida cotidiana
- Celebras los pequeños logros del estudiante

ADAPTACIÓN AL NIVEL ({education_level}):
{level_guidance}

TUS RESPONSABILIDADES COMO DON PIPO:
1. 📚 Explicar cualquier tema de forma clara y amena
2. 🎯 Resolver dudas paso a paso, sin prisas
3. 💡 Dar ejemplos prácticos y cercanos
4. 🌟 Motivar y animar al estudiante
5. 🔄 Reexplicar de otra forma si no se entiende
6. ✨ Hacer que aprender sea agradable

ESTILO DE RESPUESTAS DE DON PIPO:
- Saluda con cercanía (¡Hola! ¿En qué puedo ayudarte hoy? 😊)
- Usa emojis de forma moderada para dar calidez 
- Divide explicaciones en pasos sencillos
- Resalta lo importante con **negrita**
- Termina animando o resumiendo lo clave
- Si detectas frustración, sé extra paciente y motivador

Recuerda: No eres una IA fría, eres Don Pipo, un profesor que realmente se preocupa por que sus estudiantes aprendan y se sientan cómodos. 🎓
"""

    @staticmethod
    async def chat(
        messages: List[Dict[str, str]], 
        education_level: str = "secundaria",
        image_url: Optional[str] = None
    ) -> str:
        """
        Procesa una conversación con la IA.
        
        Args:
            messages: Lista de mensajes previos
            education_level: Nivel educativo del estudiante
            image_url: URL de imagen si hay una (para OCR/análisis)
        """
        try:
            system_message = {"role": "system", "content": AIService.get_system_prompt(education_level)}
            
            # Si hay una imagen, usar GPT-4 Vision
            if image_url:
                # Preparar mensaje con imagen
                user_message = messages[-1]
                vision_message = {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_message["content"]},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url}
                        }
                    ]
                }
                
                conversation = [system_message] + messages[:-1] + [vision_message]
                
                # Nota: Modelos de visión descontinuados. Usando modelo de texto para análisis
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=conversation,
                    max_tokens=1500,
                    temperature=0.7
                )
            else:
                # Chat normal con GPT-4
                conversation = [system_message] + messages
                
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=conversation,
                    max_tokens=1500,
                    temperature=0.7
                )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error en AI Service: {str(e)}")
            return f"Lo siento, hubo un error al procesar tu consulta: {str(e)}"

    @staticmethod
    async def generate_summary(text: str, education_level: str = "secundaria") -> str:
        """Genera un resumen del texto proporcionado."""
        try:
            prompt = f"""Como tutor para nivel {education_level}, crea un resumen conciso y claro del siguiente contenido. 
            Organiza la información en puntos clave y resalta los conceptos más importantes.
            
            Contenido:
            {text}
            
            Resumen:"""
            
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": AIService.get_system_prompt(education_level)},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.5
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error generando resumen: {str(e)}")
            return "Error al generar el resumen"

    @staticmethod
    async def extract_key_concepts(text: str) -> List[str]:
        """Extrae conceptos clave de un texto."""
        try:
            prompt = f"""Analiza el siguiente texto y extrae los 5-10 conceptos clave más importantes.
            Devuelve solo una lista JSON con los conceptos, sin explicaciones adicionales.
            
            Texto:
            {text}
            
            Responde en formato: ["concepto1", "concepto2", ...]"""
            
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            concepts = json.loads(content)
            return concepts
            
        except Exception as e:
            print(f"Error extrayendo conceptos: {str(e)}")
            return []

