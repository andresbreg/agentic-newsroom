import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { FileText, ExternalLink } from 'lucide-react';

const Newsroom = () => {
    const { addToast } = useToast();
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchApprovedNews = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/news/approved');
            if (response.ok) {
                const data = await response.json();
                setNewsItems(data);
            }
        } catch (error) {
            console.error('Error fetching approved news:', error);
            addToast('Error al cargar noticias aprobadas', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovedNews();
    }, []);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-slate-900 dark:text-white" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sala de Redacción</h1>
                </div>
            </div>

            {newsItems.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No hay noticias aprobadas aún.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {newsItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {item.source ? item.source.name : 'Fuente'}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(item.published_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        {item.summary || "Sin resumen disponible."}
                                    </p>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
                                    >
                                        Leer nota completa <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Newsroom;

