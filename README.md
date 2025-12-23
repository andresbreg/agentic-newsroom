# Agentic Newsroom

Una plataforma inteligente de monitoreo y análisis de noticias que utiliza agentes de IA para automatizar el flujo de trabajo de una agencia de noticias.

## 🚀 Características Principales

- **Ingesta Automatizada**: Procesamiento robusto de feeds RSS con limpieza de HTML y filtros de relevancia temporal (últimas 24h).
- **Procesamiento Inteligente (Pipelines de IA)**:
  - **Detección de Idiomas**: Identificación automática del idioma original de las noticias.
  - **Traducción Automática**: Traducción de noticias de múltiples idiomas al español utilizando modelos de lenguaje (Groq/LLMs).
  - **Extracción de Entidades**: Identificación automatizada de Personas, Organizaciones, Ubicaciones y Conceptos Clave utilizando NLP.
- **Gestión de Contenidos**:
  - **Dashboard de Monitoreo**: Visualización en tiempo real del estado del sistema y estadísticas.
  - **Temas de Interés**: Configuración de alcances, palabras clave y exclusiones para filtrar noticias relevantes.
  - **Sistema de Etiquetas y Entidades**: Organización taxonómica y asociación de noticias.
  - **Gestión de Ciclo de Vida**: Flujo de aprobación/rechazo y papelera de reciclaje.
- **Administración del Sistema**:
  - **Configuración de IA**: Ajuste de parámetros de los agentes y modelos utilizados.
  - **Backup & Restore**: Exportación e importación completa de la configuración del sistema (fuentes, temas, etiquetas, entidades).

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: FastAPI (Python)
- **Base de Datos**: SQLite con SQLAlchemy ORM
- **IA/ML**:
  - Groq & Google Gemini (LLMs para traducción y extracción)
  - Langdetect (Detección de idioma)
  - BeautifulSoup4 (Web scraping)
  - Feedparser (Ingesta RSS)

### Frontend
- **Framework**: React.js con Vite
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Estado/Rutas**: React Router, Context API

## 📋 Estructura del Proyecto

```
agentic-newsroom/
├── backend/            # API FastAPI y Servicios de Agentes
│   ├── main.py         # Punto de entrada y Endpoints
│   ├── models.py       # Modelos de Base de Datos
│   ├── services/       # Lógica de Ingesta, Traducción y Extracción
│   └── database.py     # Configuración de SQLAlchemy
└── frontend/           # Aplicación React + Vite
    ├── src/
    │   ├── pages/      # Vistas (News, Sources, Entities, etc.)
    │   ├── components/ # Componentes Reutilizables
    │   └── context/    # Gestión de Estado Global
    └── ...
```

## ⚙️ Instalación y Ejecución

### Requisitos Previos

- Node.js (v18+)
- Python (v3.8+)
- API Key de Groq/Gemini (configurada en `backend/.env`)

### Preparación del Backend

1. Navegar al directorio `backend`:
   ```bash
   cd backend
   ```
2. Crear y activar un entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configurar variables de entorno:
   - Crear un archivo `.env` basado en las necesidades del sistema (debe incluir `GROQ_API_KEY`).
5. Iniciar el servidor:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Preparación del Frontend

1. Navegar al directorio `frontend`:
   ```bash
   cd frontend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.
