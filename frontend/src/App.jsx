import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Newsroom from './pages/Newsroom';
import Settings from './pages/Settings';
import AIConfig from './pages/AIConfig';
import Trash from './pages/Trash';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { HighlightProvider } from './context/HighlightContext';

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <HighlightProvider>
                    <Router>
                        <Routes>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Dashboard />} />
                                <Route path="newsroom" element={<Newsroom />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="ai-config" element={<AIConfig />} />
                                <Route path="trash" element={<Trash />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Route>
                        </Routes>
                    </Router>
                </HighlightProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
