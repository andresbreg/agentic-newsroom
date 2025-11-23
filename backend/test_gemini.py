from google import genai
import os

# --- PEGA TU API KEY AQUÍ ---
API_KEY = "AIzaSyCVTYDXPXFDm6byoEC1tbn811Lc5AxbEQk" 

print("1. Iniciando Cliente con librería moderna (google-genai)...")
try:
    client = genai.Client(api_key=API_KEY)
    
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