import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import News from './pages/News';
import Newsroom from './pages/Newsroom';
import Sources from './pages/Sources';
import AIConfig from './pages/AIConfig';
import Trash from './pages/Trash';
import Topics from './pages/Topics';
import Tags from './pages/Tags';
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
                                <Route index element={<News />} />
                                <Route path="newsroom" element={<Newsroom />} />
                                <Route path="topics" element={<Topics />} />
                                <Route path="tags" element={<Tags />} />
                                <Route path="sources" element={<Sources />} />
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
