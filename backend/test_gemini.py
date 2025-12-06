from google import genai
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env (en la carpeta frontend)
env_path = Path(__file__).resolve().parent.parent / "frontend" / ".env"
load_dotenv(dotenv_path=env_path)

# Obtener API_KEY desde variables de entorno
api = os.getenv("API_KEY") 

print("1. Iniciando Cliente con librería moderna (google-genai)...")
try:
    client = genai.Client(api_key=api)
    
    print("2. Enviando mensaje a Gemini 1.5 Flash...")
    
    # Usamos el modelo estable estándar
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Responde solo con la palabra: ÉXITO"
    )
    
    print(f"3. Respuesta recibida: {response.text}")
    print("✅ CONEXIÓN TOTALMENTE OPERATIVA")

except Exception as e:
    print(f"❌ ERROR CRÍTICO: {e}")