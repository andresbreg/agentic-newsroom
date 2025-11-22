import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-14 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] animate-in slide-in-from-right fade-in duration-300
              ${toast.type === 'success' ? 'bg-green-600' : ''}
              ${toast.type === 'error' ? 'bg-red-600' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-600' : ''}
              ${toast.type === 'info' ? 'bg-blue-600' : ''}
            `}
                    >
                        {toast.type === 'success' && <CheckCircle size={18} />}
                        {toast.type === 'error' && <AlertCircle size={18} />}
                        {toast.type === 'warning' && <AlertTriangle size={18} />}
                        {toast.type === 'info' && <Info size={18} />}
                        <span className="flex-1 text-sm font-medium">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="hover:opacity-80">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
