import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { FileText, ExternalLink } from 'lucide-react';

const Redaccion = () => {
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

    const handleGenerateSummary = (id) => {
        console.log(`Generating summary for item ${id}`);
        addToast('Generando resumen... (Simulado)', 'info');
    };

    useEffect(() => {
        fetchApprovedNews();
    }, []);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    Redacción
                </h1>
            </div>

            {newsItems.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No hay noticias aprobadas para procesar.</p>
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
                                    <th className="px-4 py-3 font-medium w-48 text-right">Acciones</th>
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
                                            <span className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                {item.title}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                    title="Ver Original"
                                                >
                                                    <ExternalLink size={18} />
                                                </a>
                                                <button
                                                    onClick={() => handleGenerateSummary(item.id)}
                                                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
                                                >
                                                    Generar Resumen
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

export default Redaccion;
