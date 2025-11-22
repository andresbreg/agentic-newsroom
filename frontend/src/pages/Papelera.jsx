import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Trash2, RotateCcw, CheckSquare, Square, CheckCircle } from 'lucide-react';

const Papelera = () => {
    const { addToast } = useToast();
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState(new Set());

    const fetchRejectedNews = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/news/rejected');
            if (response.ok) {
                const data = await response.json();
                setNewsItems(data);
            }
        } catch (error) {
            console.error('Error fetching rejected news:', error);
            addToast('Error al cargar la papelera', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRejectedNews();
    }, []);

    const handleRestore = async (id) => {
        try {
            const response = await fetch(`http://localhost:8000/api/news/${id}/restore`, {
                method: 'PUT'
            });
            if (response.ok) {
                setNewsItems(prev => prev.filter(item => item.id !== id));
                setSelectedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
                addToast('Noticia restaurada', 'success');
            } else {
                addToast('Error al restaurar', 'error');
            }
        } catch (error) {
            addToast('Error de conexión', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta noticia permanentemente?')) return;

        try {
            const response = await fetch(`http://localhost:8000/api/news/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setNewsItems(prev => prev.filter(item => item.id !== id));
                setSelectedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
                addToast('Noticia eliminada permanentemente', 'success');
            } else {
                addToast('Error al eliminar', 'error');
            }
        } catch (error) {
            addToast('Error de conexión', 'error');
        }
    };

    const handleEmptyTrash = async () => {
        if (!window.confirm('¿Estás seguro de que deseas vaciar la papelera? Esta acción no se puede deshacer.')) return;

        try {
            const response = await fetch('http://localhost:8000/api/news/rejected/all', {
                method: 'DELETE'
            });
            if (response.ok) {
                setNewsItems([]);
                setSelectedItems(new Set());
                addToast('Papelera vaciada', 'success');
            } else {
                addToast('Error al vaciar la papelera', 'error');
            }
        } catch (error) {
            addToast('Error de conexión', 'error');
        }
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === newsItems.length && newsItems.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(newsItems.map(item => item.id)));
        }
    };

    const toggleSelectItem = (id) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const handleBatchRestore = async () => {
        const ids = Array.from(selectedItems);
        try {
            const response = await fetch('http://localhost:8000/api/news/batch/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (response.ok) {
                setNewsItems(prev => prev.filter(item => !selectedItems.has(item.id)));
                setSelectedItems(new Set());
                addToast(`${ids.length} noticias restauradas`, 'success');
            } else {
                console.error('Batch restore error:', await response.text());
                addToast('Error al restaurar noticias', 'error');
            }
        } catch (error) {
            console.error('Batch restore network error:', error);
            addToast('Error de conexión', 'error');
        }
    };

    const handleBatchDelete = async () => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente ${selectedItems.size} noticias?`)) return;

        const ids = Array.from(selectedItems);
        try {
            const response = await fetch('http://localhost:8000/api/news/batch/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (response.ok) {
                setNewsItems(prev => prev.filter(item => !selectedItems.has(item.id)));
                setSelectedItems(new Set());
                addToast(`${ids.length} noticias eliminadas`, 'success');
            } else {
                console.error('Batch delete error:', await response.text());
                addToast('Error al eliminar noticias', 'error');
            }
        } catch (error) {
            console.error('Batch delete network error:', error);
            addToast('Error de conexión', 'error');
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Trash2 className="text-red-600" />
                    Papelera de Reciclaje
                </h1>

                <div className="flex items-center gap-3">
                    {selectedItems.size > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                            <button
                                onClick={handleBatchRestore}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm font-medium"
                            >
                                <RotateCcw size={16} />
                                Restaurar ({selectedItems.size})
                            </button>
                            <button
                                onClick={handleBatchDelete}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-sm font-medium"
                            >
                                <Trash2 size={16} />
                                Eliminar ({selectedItems.size})
                            </button>
                        </div>
                    )}

                    {newsItems.length > 0 && (
                        <button
                            onClick={handleEmptyTrash}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <Trash2 size={16} />
                            Vaciar Todo
                        </button>
                    )}
                </div>
            </div>

            {newsItems.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <Trash2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">La papelera está vacía.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        >
                                            {selectedItems.size === newsItems.length && newsItems.length > 0 ? (
                                                <CheckSquare size={20} className="text-indigo-600" />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium w-32">Fecha</th>
                                    <th className="px-4 py-3 font-medium w-24">Fuente</th>
                                    <th className="px-4 py-3 font-medium">Título</th>
                                    <th className="px-4 py-3 font-medium w-48 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {newsItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`
                                            hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                                            ${selectedItems.has(item.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                        `}
                                    >
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleSelectItem(item.id)}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            >
                                                {selectedItems.has(item.id) ? (
                                                    <CheckSquare size={20} className="text-indigo-600" />
                                                ) : (
                                                    <Square size={20} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(item.published_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                {item.source ? item.source.name : 'Fuente'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                {item.title}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleRestore(item.id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                    title="Restaurar"
                                                >
                                                    <RotateCcw size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title="Eliminar permanentemente"
                                                >
                                                    <Trash2 size={20} />
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

export default Papelera;
