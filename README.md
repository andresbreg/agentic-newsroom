# Agentic Newsroom Shell

This is the shell structure for the Agentic Newsroom application, featuring a React frontend and a FastAPI backend.

## Prerequisites

- Node.js (v18+)
- Python (v3.8+)

## Project Structure

```
agentic-newsroom/
├── backend/            # FastAPI Backend
│   ├── main.py
│   └── requirements.txt
└── frontend/           # React + Vite Frontend
    ├── src/
    ├── package.json
    └── ...
```

## Installation & Running

### Backend

1. Navigate to the `backend` directory (or root):
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000`.
   Check status at `http://localhost:8000/api/status`.

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Features

- **Collapsible Sidebar**: Navigation with Dashboard and Settings.
- **Status Bar**: Real-time backend connection status and system toggle.
- **Notifications**: Toast notification system (testable on Dashboard).
- **Modern UI**: Built with Tailwind CSS and Lucide Icons.
