from passlib.context import CryptContext

# Configurar contexto de encriptación
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    """Servicio para autenticación y manejo de contraseñas."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Encripta una contraseña."""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifica si una contraseña coincide con su hash."""
        return pwd_context.verify(plain_password, hashed_password)

