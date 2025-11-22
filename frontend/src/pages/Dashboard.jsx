import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
    const { addToast } = useToast();
    const [stats, setStats] = useState({
        active_news: 0,
        sources_count: 0,
        pending_alerts: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/dashboard-stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Panel de Control</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Noticias Activas</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {loading ? '...' : stats.active_news}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Fuentes Conectadas</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {loading ? '...' : stats.sources_count}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Alertas Pendientes</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {loading ? '...' : stats.pending_alerts}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prueba de Sistema</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Utiliza los botones a continuación para probar el sistema de notificaciones.</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => addToast('Esta es una notificación de prueba', 'info')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Probar Notificación Info
                    </button>
                    <button
                        onClick={() => addToast('Operación exitosa', 'success')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Probar Success
                    </button>
                    <button
                        onClick={() => addToast('Hubo un error en el sistema', 'error')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Probar Error
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
