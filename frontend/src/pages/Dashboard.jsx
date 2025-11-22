import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
    const { addToast } = useToast();
    const [stats, setStats] = useState({
        active_news: 0,
        sources_count: 0,
        pending_alerts: 0
    });
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/dashboard-stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const fetchNews = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/news/discovered');
            if (response.ok) {
                const data = await response.json();
                setNewsItems(data);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        }
    };

    const handleScan = async () => {
        setScanning(true);
        try {
            const response = await fetch('http://localhost:8000/api/scan', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                addToast(`Escaneo completado. ${data.new_items} noticias nuevas.`, 'success');
                fetchStats();
                fetchNews();
            } else {
                addToast('Error al escanear fuentes.', 'error');
            }
        } catch (error) {
            addToast('Error de conexión.', 'error');
        } finally {
            setScanning(false);
        }
    };

    const updateStatus = async (id, status) => {
        // Optimistic update
        setNewsItems(prev => prev.filter(item => item.id !== id));

        try {
            const response = await fetch(`http://localhost:8000/api/news/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            addToast(status === 'APPROVED' ? 'Noticia aprobada' : 'Noticia descartada', 'success');
            fetchStats(); // Update stats to reflect changes
        } catch (error) {
            console.error('Error updating status:', error);
            addToast('Error al actualizar estado', 'error');
            fetchNews(); // Revert on error
        }
    };

    useEffect(() => {
        Promise.all([fetchStats(), fetchNews()]).finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
                <button
                    onClick={handleScan}
                    disabled={scanning}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 ${scanning ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                    {scanning ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sincronizando...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sincronizar RSS
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors duration-300">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Noticias Activas</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {loading ? '...' : stats.active_news}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors duration-300">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Fuentes</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {loading ? '...' : stats.sources_count}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors duration-300">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Alertas</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {loading ? '...' : stats.pending_alerts}
                    </p>
                </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Noticias Descubiertas</h2>

            {newsItems.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No hay noticias nuevas. Sincroniza las fuentes RSS.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 font-medium w-32">Fecha</th>
                                    <th className="px-4 py-3 font-medium w-24">Fuente</th>
                                    <th className="px-4 py-3 font-medium">Título</th>
                                    <th className="px-4 py-3 font-medium w-32 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {newsItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(item.published_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                RSS
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1">
                                                {item.title}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => updateStatus(item.id, 'APPROVED')}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                                                    title="Aprobar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(item.id, 'REJECTED')}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title="Descartar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
