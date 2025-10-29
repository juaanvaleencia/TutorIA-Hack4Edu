import base64
import os
from groq import Groq
from typing import Optional

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class OCRService:
    
    @staticmethod
    async def process_image(image_data: str, context: str = "") -> str:
        """
        Procesa una imagen usando GPT-4 Vision para extraer texto y análisis.
        
        Args:
            image_data: Imagen en base64 o URL
            context: Contexto adicional sobre qué buscar en la imagen
        
        Returns:
            Texto extraído y análisis de la imagen
        """
        try:
            # Preparar el prompt según el contexto
            if not context:
                context = "Analiza esta imagen. Si contiene texto escrito a mano o impreso, transcríbelo completamente. Si es un ejercicio matemático o problema, identifica el tipo de problema y los datos relevantes."
            
            # Determinar si es base64 o URL
            if image_data.startswith("http"):
                image_url = image_data
            else:
                # Es base64
                if not image_data.startswith("data:image"):
                    image_data = f"data:image/jpeg;base64,{image_data}"
                image_url = image_data
            
            # NOTA: Los modelos de visión de Groq han sido descontinuados.
            # Usando modelo de texto. Para soporte de imágenes completo, considerar otra API.
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": context},
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url}
                            }
                        ]
                    }
                ],
                max_tokens=1500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error en OCR Service: {str(e)}")
            return f"Error al procesar la imagen: {str(e)}"
    
    @staticmethod
    async def analyze_exercise(image_data: str, subject: Optional[str] = None) -> dict:
        """
        Analiza un ejercicio en una imagen y proporciona una solución paso a paso.
        
        Args:
            image_data: Imagen del ejercicio
            subject: Materia del ejercicio (opcional)
        
        Returns:
            Diccionario con el análisis y solución
        """
        try:
            subject_context = f" de {subject}" if subject else ""
            prompt = f"""Analiza este ejercicio{subject_context} y proporciona:

1. **Transcripción**: Escribe exactamente lo que dice el ejercicio
2. **Tipo de problema**: Identifica qué tipo de problema es
3. **Datos conocidos**: Lista todos los datos proporcionados
4. **Solución paso a paso**: Explica cada paso del proceso de resolución
5. **Respuesta final**: Presenta la respuesta de forma clara
6. **Verificación**: Si es posible, verifica la respuesta

Usa formato markdown para que sea fácil de leer."""
            
            result_text = await OCRService.process_image(image_data, prompt)
            
            return {
                "success": True,
                "analysis": result_text
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "analysis": "No se pudo analizar el ejercicio"
            }
    
    @staticmethod
    async def extract_notes(image_data: str) -> str:
        """
        Extrae y organiza apuntes de una imagen.
        """
        try:
            prompt = """Transcribe completamente estos apuntes. Organiza el contenido de forma clara:

- Mantén la estructura original (títulos, subtítulos, listas)
- Corrige errores ortográficos evidentes
- Usa formato markdown
- Si hay diagramas o fórmulas, descríbelos lo mejor posible

Transcripción:"""
            
            return await OCRService.process_image(image_data, prompt)
            
        except Exception as e:
            return f"Error al extraer apuntes: {str(e)}"

