import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Redaccion from './pages/Redaccion';
import Settings from './pages/Settings';
import AIConfig from './pages/AIConfig';
import Papelera from './pages/Papelera';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="redaccion" element={<Redaccion />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="ai-config" element={<AIConfig />} />
                            <Route path="papelera" element={<Papelera />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                </Router>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
