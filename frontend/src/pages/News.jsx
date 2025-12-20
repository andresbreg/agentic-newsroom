import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Filter, CheckSquare, Square, Trash2, CheckCircle, RefreshCw, LayoutDashboard, ExternalLink, Sparkles, FileText, Fingerprint } from 'lucide-react';
import { useHighlight } from '../context/HighlightContext';
import Reader from '../components/Reader';
import { cn } from '../lib/utils';

const News = () => {
    const { addToast } = useToast();
    const { highlights, addHighlight } = useHighlight();
    const [stats, setStats] = useState({
        active_news: 0,
        sources_count: 0
    });
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [extracting, setExtracting] = useState(false);

    // New State
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [filterSource, setFilterSource] = useState('');
    const [sources, setSources] = useState([]);
    const [readingItem, setReadingItem] = useState(null);

    const [newlyFoundIds, setNewlyFoundIds] = useState([]);

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

    const fetchSources = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/sources');
            if (response.ok) {
                const data = await response.json();
                setSources(data);
            }
        } catch (error) {
            console.error('Error fetching sources:', error);
        }
    };

    const handleScan = async () => {
        setScanning(true);
        try {
            const response = await fetch('http://localhost:8000/api/scan', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                addToast(`Escaneo completado. ${data.new_items} noticias nuevas.`, 'success');
                setNewlyFoundIds(data.new_item_ids || []);
                await fetchStats();
                await fetchNews();
            } else {
                addToast('Error al escanear fuentes.', 'error');
            }
        } catch (error) {
            addToast('Error de conexión.', 'error');
        } finally {
            setScanning(false);
        }
    };


    const handleExtractEntities = async () => {
        setExtracting(true);
        try {
            const response = await fetch('http://localhost:8000/api/extract-entities', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                addToast(`Extracción completada. ${data.extracted_count} entidades vinculadas.`, 'success');
                await fetchNews();
            } else {
                addToast('Error al extraer entidades.', 'error');
            }
        } catch (error) {
            addToast('Error de conexión.', 'error');
        } finally {
            setExtracting(false);
        }
    };

    const updateStatus = async (id, status) => {
        // Optimistic update
        setNewsItems(prev => prev.filter(item => item.id !== id));
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });

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
            if (status === 'REJECTED') {
                addHighlight('trash', [id]);
            }
            fetchStats(); // Update stats to reflect changes
        } catch (error) {
            console.error('Error updating status:', error);
            addToast('Error al actualizar estado', 'error');
            fetchNews(); // Revert on error
        }
    };

    const handleBulkAction = async (status) => {
        const itemsToProcess = Array.from(selectedItems);
        setSelectedItems(new Set()); // Clear selection immediately

        // Optimistic UI update
        setNewsItems(prev => prev.filter(item => !selectedItems.has(item.id)));

        let successCount = 0;
        for (const id of itemsToProcess) {
            try {
                const response = await fetch(`http://localhost:8000/api/news/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                if (response.ok) successCount++;
            } catch (error) {
                console.error(`Error updating item ${id}`, error);
            }
        }

        addToast(`${successCount} noticias ${status === 'APPROVED' ? 'aprobadas' : 'descartadas'}`, 'success');
        fetchStats();
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === filteredNews.length && filteredNews.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredNews.map(item => item.id)));
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

    useEffect(() => {
        Promise.all([fetchStats(), fetchNews(), fetchSources()]).finally(() => setLoading(false));
    }, []);



    // Filter Logic
    const filteredNews = newsItems.filter(item => {
        if (!filterSource) return true;
        return item.source_id === parseInt(filterSource);
    });

    // Navigation for Reader (Moved here to avoid ReferenceError)
    const readingIndex = readingItem ? filteredNews.findIndex(i => i.id === readingItem.id) : -1;

    const handleNext = () => {
        if (readingIndex < filteredNews.length - 1) {
            setReadingItem(filteredNews[readingIndex + 1]);
        }
    };

    const handlePrev = () => {
        if (readingIndex > 0) {
            setReadingItem(filteredNews[readingIndex - 1]);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-slate-900 dark:text-white" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de Noticias</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExtractEntities}
                        disabled={extracting}
                        className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 ${extracting ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        <Fingerprint size={20} className={extracting ? 'animate-pulse' : ''} />
                        {extracting ? 'Identificando...' : 'Identificar Entidades'}
                    </button>
                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 ${scanning ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        <RefreshCw size={20} className={scanning ? 'animate-spin' : ''} />
                        {scanning ? 'Sincronizar RSS' : 'Sincronizar RSS'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 px-4 h-12 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors duration-300">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Noticias</h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {loading ? '...' : stats.active_news}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 px-4 h-12 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors duration-300">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Fuentes</h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {loading ? '...' : stats.sources_count}
                    </p>
                </div>
                <div className="flex items-center justify-end px-4 transition-colors duration-300">
                    <div className="h-12 relative ml-auto bg-white dark:bg-gray-800 rounded-md shadow-sm border dark:border-gray-700 flex items-center">
                        <select
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                            className="appearance-none dark:bg-gray-800 dark:text-gray-300 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">Todas</option>
                            {sources.map(source => (
                                <option key={source.id} value={source.id}>{source.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                            <Filter size={14} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end items-center mb-4 gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Bulk Actions */}
                    {selectedItems.size > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                            <button
                                onClick={() => handleBulkAction('APPROVED')}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm font-medium"
                            >
                                <CheckCircle size={16} />
                                Aprobar ({selectedItems.size})
                            </button>
                            <button
                                onClick={() => handleBulkAction('REJECTED')}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-sm font-medium"
                            >
                                <Trash2 size={16} />
                                Descartar ({selectedItems.size})
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {filteredNews.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No hay noticias nuevas. Sincroniza las fuentes RSS.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-2 py-3 font-medium w-8 text-center text-gray-400">#</th>
                                    <th className="px-4 py-3 font-medium w-10 text-gray-400">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        >
                                            {selectedItems.size === filteredNews.length && filteredNews.length > 0 ? (
                                                <CheckSquare size={18} className="text-indigo-600" />
                                            ) : (
                                                <Square size={18} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium w-24">Fecha</th>
                                    <th className="px-4 py-3 font-medium w-20">Fuente</th>
                                    <th className="px-4 py-3 font-medium w-16 text-center">IDM</th>
                                    <th className="px-4 py-3 font-medium">Título</th>
                                    <th className="px-4 py-3 font-medium w-28 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredNews.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className={`
                                            hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-500
                                            ${selectedItems.has(item.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                            ${newlyFoundIds.includes(item.id) && !selectedItems.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                            ${highlights.dashboard.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                        `}
                                    >
                                        <td className="px-2 py-3 text-center text-[10px] text-gray-400 font-mono">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleSelectItem(item.id)}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            >
                                                {selectedItems.has(item.id) ? (
                                                    <CheckSquare size={18} className="text-indigo-600" />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                                            {new Date(item.published_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                {item.source ? item.source.name : 'Fuente'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.language ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 uppercase tracking-tight">
                                                    {item.language}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-[10px]">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                                            <span className={`font-medium line-clamp-1 text-sm mb-1 ${!item.title_es ? 'opacity-60' : ''
                                                }`}>
                                                {item.title_es || item.title}
                                            </span>
                                            {item.entities && item.entities.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.entities.map(entity => (
                                                        <span
                                                            key={entity.id}
                                                            className={cn(
                                                                "px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors",
                                                                entity.type === 'PERSON' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                                                                    entity.type === 'ORGANIZATION' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" :
                                                                        entity.type === 'LOCATION' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                                            "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300"
                                                            )}
                                                        >
                                                            {entity.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                {item.content_snippet && (
                                                    <button
                                                        onClick={() => setReadingItem(item)}
                                                        className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                                                        title="Leer contenido"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                )}
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                    title="Ver original"
                                                >
                                                    <ExternalLink size={18} />
                                                </a>
                                                <button
                                                    onClick={() => updateStatus(item.id, 'APPROVED')}
                                                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                                                    title="Aprobar"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(item.id, 'REJECTED')}
                                                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title="Descartar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table >
                    </div >
                </div >
            )}

            {/* Reader Modal */}
            <Reader
                item={readingItem}
                onClose={() => setReadingItem(null)}
                onNext={handleNext}
                onPrev={handlePrev}
                hasNext={readingIndex < filteredNews.length - 1}
                hasPrev={readingIndex > 0}
            />
        </div >
    );
};

export default News;
