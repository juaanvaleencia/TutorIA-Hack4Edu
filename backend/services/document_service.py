import os
from typing import Optional
import PyPDF2
from docx import Document as DocxDocument
import chardet
from pathlib import Path


class DocumentService:
    """Servicio para procesar documentos (PDF, DOCX, TXT)."""
    
    UPLOAD_DIR = "uploads/documents"
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt'}
    
    @staticmethod
    def ensure_upload_dir():
        """Crea el directorio de uploads si no existe."""
        os.makedirs(DocumentService.UPLOAD_DIR, exist_ok=True)
    
    @staticmethod
    def validate_file(filename: str, file_size: int) -> tuple[bool, Optional[str]]:
        """
        Valida que el archivo tenga una extensión permitida y tamaño adecuado.
        
        Returns:
            tuple: (es_valido, mensaje_error)
        """
        # Validar extensión
        file_ext = Path(filename).suffix.lower()
        if file_ext not in DocumentService.ALLOWED_EXTENSIONS:
            return False, f"Formato no permitido. Usa: {', '.join(DocumentService.ALLOWED_EXTENSIONS)}"
        
        # Validar tamaño
        if file_size > DocumentService.MAX_FILE_SIZE:
            return False, f"Archivo muy grande. Máximo: {DocumentService.MAX_FILE_SIZE / (1024*1024):.0f} MB"
        
        return True, None
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extrae texto de un archivo PDF."""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Error al leer PDF: {str(e)}")
    
    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extrae texto de un archivo DOCX."""
        try:
            doc = DocxDocument(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Error al leer DOCX: {str(e)}")
    
    @staticmethod
    def extract_text_from_txt(file_path: str) -> str:
        """Extrae texto de un archivo TXT."""
        try:
            # Detectar codificación
            with open(file_path, 'rb') as file:
                raw_data = file.read()
                result = chardet.detect(raw_data)
                encoding = result['encoding'] or 'utf-8'
            
            # Leer con la codificación detectada
            with open(file_path, 'r', encoding=encoding) as file:
                text = file.read()
            return text.strip()
        except Exception as e:
            raise Exception(f"Error al leer TXT: {str(e)}")
    
    @staticmethod
    def extract_text(file_path: str, file_type: str) -> str:
        """
        Extrae texto de un archivo según su tipo.
        
        Args:
            file_path: Ruta al archivo
            file_type: Tipo de archivo (pdf, docx, txt)
            
        Returns:
            str: Texto extraído del archivo
        """
        file_type = file_type.lower().replace('.', '')
        
        if file_type == 'pdf':
            return DocumentService.extract_text_from_pdf(file_path)
        elif file_type == 'docx':
            return DocumentService.extract_text_from_docx(file_path)
        elif file_type == 'txt':
            return DocumentService.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Tipo de archivo no soportado: {file_type}")
    
    @staticmethod
    def count_words(text: str) -> int:
        """Cuenta el número de palabras en un texto."""
        return len(text.split())
    
    @staticmethod
    def generate_summary(text: str, max_length: int = 500) -> str:
        """
        Genera un resumen del texto (simplemente toma los primeros caracteres).
        
        Para un resumen real con IA, usar AIService.
        """
        if len(text) <= max_length:
            return text
        return text[:max_length] + "..."

