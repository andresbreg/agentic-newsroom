import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { ToastProvider } from './context/ToastContext';

import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
