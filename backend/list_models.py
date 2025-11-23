from google import genai
import os

# --- PEGA TU API KEY AQUÍ ---
API_KEY = "AIzaSyCVTYDXPXFDm6byoEC1tbn811Lc5AxbEQk" 

client = genai.Client(api_key=API_KEY)

print("🔍 Consultando catálogo de modelos para tu API Key...")

try:
    # Pide la lista al servidor
    pager = client.models.list()
    
    print("\n✅ MODELOS DISPONIBLES (Copia uno de estos nombres):")
    print("="*50)
    count = 0
    for model in pager:
        # Solo nos interesan los que pueden generar contenido
        if "generateContent" in model.supported_actions:
            print(f"👉 {model.name}")
            count += 1
    
    if count == 0:
        print("⚠️ No se encontraron modelos con permiso 'generateContent'.")

except Exception as e:
    print(f"❌ Error al listar modelos: {e}")