import json
from groq import Groq
import os
from typing import List, Dict

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class GamesService:
    
    @staticmethod
    async def generate_pasapalabra(
        subject: str,
        topic: str,
        education_level: str = "secundaria"
    ) -> Dict:
        """
        Genera un juego de Pasapalabra (rosco de palabras).
        26 definiciones (A-Z) con sus respuestas.
        """
        try:
            prompt = f"""Genera un juego de PASAPALABRA sobre {topic} en la materia de {subject}.

Nivel educativo: {education_level}

Crea exactamente 26 definiciones (una por cada letra del abecedario A-Z).

⚠️ REGLAS ESTRICTAS - MUY IMPORTANTE:
- Para cada letra (A, B, C... Z), la RESPUESTA DEBE EMPEZAR CON ESA LETRA
- Ejemplo: Letra "A" → Respuesta debe empezar con "A" (como "Átomo", "Agua", "Arco")
- Ejemplo: Letra "B" → Respuesta debe empezar con "B" (como "Biología", "Bosque", "Base")
- NUNCA pongas una respuesta que no empiece con la letra correspondiente
- ⚠️ CRÍTICO: La palabra respuesta NO DEBE aparecer expresamente en la definición/pregunta
  Ejemplo INCORRECTO: Letra "A" → Definición: "Es el Átomo" → Respuesta: "Átomo"
  Ejemplo CORRECTO: Letra "A" → Definición: "Unidad básica de la materia" → Respuesta: "Átomo"
- Todas las palabras deben estar relacionadas con {topic}
- Adapta el vocabulario al nivel {education_level}
- Si una letra es muy difícil para el tema, busca términos relacionados o científicos

VERIFICACIÓN:
Antes de responder, verifica que:
- La letra "A" tenga una respuesta que empiece por "A"
- La letra "B" tenga una respuesta que empiece por "B"
- Y así sucesivamente hasta "Z"

Formato JSON:
{{
  "letters": [
    {{
      "letter": "A",
      "definition": "Unidad básica de la materia",
      "answer": "Átomo",
      "type": "starts"
    }},
    {{
      "letter": "B",
      "definition": "Ciencia que estudia los seres vivos",
      "answer": "Biología",
      "type": "starts"
    }}
  ]
}}

Responde SOLO con el JSON, sin texto adicional."""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=3000,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            game_data = json.loads(content)
            
            # Validar que las respuestas empiecen con la letra correcta
            if "letters" in game_data:
                validated_letters = []
                for item in game_data["letters"]:
                    letter = item.get("letter", "").upper()
                    answer = item.get("answer", "").strip()
                    
                    # Verificar que la respuesta empiece con la letra correcta
                    if answer and answer[0].upper() == letter:
                        validated_letters.append(item)
                    else:
                        # Si no empieza con la letra, log de advertencia
                        print(f"⚠️ Pasapalabra: Palabra '{answer}' no empieza con '{letter}'. Omitiendo.")
                
                # Solo devolver las palabras validadas
                game_data["letters"] = validated_letters
            
            return game_data
            
        except Exception as e:
            print(f"Error generando Pasapalabra: {str(e)}")
            return {"letters": []}
    
    @staticmethod
    async def generate_atrapa_millon(
        subject: str,
        topic: str,
        education_level: str = "secundaria"
    ) -> Dict:
        """
        Genera un juego de Atrapa un Millón.
        10 preguntas con 4 opciones cada una, dificultad progresiva.
        Sistema de apuestas: empiezas con 1.000.000 puntos.
        """
        try:
            prompt = f"""Genera un juego de ATRAPA UN MILLÓN sobre {topic} en la materia de {subject}.

Nivel educativo: {education_level}

Crea exactamente 10 preguntas de opción múltiple con DIFICULTAD PROGRESIVA:
- Preguntas 1-3: FÁCILES
- Preguntas 4-7: MEDIAS
- Preguntas 8-10: DIFÍCILES

MECÁNICA DEL JUEGO:
- El jugador empieza con 1.000.000 de puntos
- En cada pregunta apuesta una cantidad de sus puntos
- Si acierta: conserva los puntos
- Si falla: pierde los puntos apostados

Requisitos:
- Cada pregunta tiene 4 opciones (A, B, C, D)
- Solo una correcta
- Dificultad debe aumentar gradualmente
- Preguntas relevantes y educativas sobre {topic}
- Las preguntas deben ser claras y precisas

Formato JSON:
{{
  "questions": [
    {{
      "number": 1,
      "difficulty": "facil",
      "question": "pregunta fácil sobre el tema",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "correct_answer": 0
    }},
    {{
      "number": 2,
      "difficulty": "facil",
      "question": "otra pregunta fácil",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "correct_answer": 1
    }}
  ]
}}

Responde SOLO con el JSON, sin texto adicional."""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=4000,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            game_data = json.loads(content)
            
            return game_data
            
        except Exception as e:
            print(f"Error generando Atrapa un Millón: {str(e)}")
            return {"questions": []}
    
    @staticmethod
    async def generate_escape_room(
        subject: str,
        topic: str,
        education_level: str = "secundaria"
    ) -> Dict:
        """
        Genera un Escape Room Educativo con enigmas y retos progresivos.
        5 salas con acertijos que deben resolverse para avanzar.
        """
        try:
            prompt = f"""Genera un ESCAPE ROOM EDUCATIVO sobre {topic} en la materia de {subject}.

Nivel educativo: {education_level}

Crea 5 SALAS (habitaciones) conectadas que el estudiante debe superar para "escapar".

ESTRUCTURA DE CADA SALA:
- Número de sala (1-5)
- Nombre temático de la sala
- Descripción del ambiente
- Un ENIGMA/RETO para resolver
- Tipo de enigma: "pregunta", "acertijo", "calculo", "ordenar", "relacionar"
- Respuesta correcta
- Pista si se equivoca
- Dificultad progresiva (sala 1 más fácil, sala 5 más difícil)

TIPOS DE ENIGMAS:
- "pregunta": Pregunta directa con respuesta corta
- "acertijo": Acertijo lógico relacionado con {topic}
- "calculo": Problema matemático/cálculo relacionado
- "ordenar": Ordenar elementos (dar opciones desordenadas)
- "relacionar": Emparejar conceptos

Formato JSON:
{{
  "title": "título del escape room",
  "theme": "tema general",
  "rooms": [
    {{
      "number": 1,
      "name": "nombre de la sala",
      "description": "descripción ambiental de la sala",
      "enigma": {{
        "type": "pregunta",
        "question": "el enigma a resolver",
        "options": ["opción 1", "opción 2", "opción 3", "opción 4"],
        "answer": "respuesta correcta",
        "hint": "pista útil si falla"
      }}
    }}
  ]
}}

Responde SOLO con el JSON, sin texto adicional."""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=3500,
                temperature=0.8,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            game_data = json.loads(content)
            
            return game_data
            
        except Exception as e:
            print(f"Error generando Escape Room: {str(e)}")
            return {"rooms": []}
    
    @staticmethod
    async def generate_ahorcado(
        subject: str,
        topic: str,
        education_level: str = "secundaria"
    ) -> Dict:
        """
        Genera un juego de Ahorcado con palabras educativas y pistas.
        10 palabras relacionadas con el tema, con definiciones/pistas.
        """
        try:
            prompt = f"""Genera un juego de AHORCADO sobre {topic} en la materia de {subject}.

Nivel educativo: {education_level}

Crea 10 PALABRAS relacionadas con {topic} que el estudiante debe adivinar.

REQUISITOS:
- Palabras de entre 5 y 12 letras
- Relevantes para {topic}
- Dificultad variada (empezar fácil, terminar difícil)
- Cada palabra tiene una PISTA/DEFINICIÓN clara
- Sin espacios ni caracteres especiales
- En ESPAÑOL

Formato JSON:
{{
  "words": [
    {{
      "word": "PALABRA",
      "hint": "pista o definición de la palabra",
      "category": "categoría específica dentro del tema",
      "difficulty": "facil"
    }},
    {{
      "word": "OTRAPALABRA",
      "hint": "pista o definición",
      "category": "categoría específica",
      "difficulty": "media"
    }}
  ]
}}

IMPORTANTE:
- Las palabras deben estar en MAYÚSCULAS
- Sin tildes en las palabras (la pista sí puede tener tildes)
- Dificultad progresiva: primeras 3 "facil", siguientes 4 "media", últimas 3 "dificil"

Responde SOLO con el JSON, sin texto adicional."""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2500,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            game_data = json.loads(content)
            
            return game_data
            
        except Exception as e:
            print(f"Error generando Ahorcado: {str(e)}")
            return {"words": []}

