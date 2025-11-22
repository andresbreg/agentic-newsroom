import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Power } from 'lucide-react';
import { clsx } from 'clsx';

const StatusBar = () => {
    const [backendStatus, setBackendStatus] = useState('checking'); // checking, online, offline
    const [systemActive, setSystemActive] = useState(() => {
        const saved = localStorage.getItem('systemActive');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('systemActive', JSON.stringify(systemActive));
    }, [systemActive]);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/status');
                if (response.ok) {
                    setBackendStatus('online');
                } else {
                    setBackendStatus('offline');
                }
            } catch (error) {
                setBackendStatus('offline');
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-10 bg-white border-t border-gray-200 flex items-center justify-between px-4 text-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Backend:</span>
                    {backendStatus === 'checking' && <span className="text-yellow-600">Conectando...</span>}
                    {backendStatus === 'online' && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                            <Wifi size={14} /> Conectado
                        </span>
                    )}
                    {backendStatus === 'offline' && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                            <WifiOff size={14} /> Desconectado
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className={clsx("font-medium transition-colors", systemActive ? "text-green-600" : "text-yellow-600")}>
                    {systemActive ? "Sistema Activo" : "Sistema en Pausa"}
                </span>
                <button
                    onClick={() => setSystemActive(!systemActive)}
                    className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                        systemActive ? "bg-green-600" : "bg-yellow-500"
                    )}
                >
                    <span
                        className={clsx(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            systemActive ? "translate-x-6" : "translate-x-1"
                        )}
                    />
                </button>
            </div>
        </div>
    );
};

export default StatusBar;
