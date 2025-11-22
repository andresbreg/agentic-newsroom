import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, Globe, Rss, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const { addToast } = useToast();
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        type: 'RSS',
        pattern: ''
    });

    const fetchSources = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/sources');
            setSources(response.data);
        } catch (error) {
            console.error('Error fetching sources:', error);
            addToast('Error al cargar las fuentes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`http://localhost:8000/api/sources/${editingId}`, formData);
                addToast('Fuente actualizada correctamente', 'success');
            } else {
                await axios.post('http://localhost:8000/api/sources', formData);
                addToast('Fuente agregada correctamente', 'success');
            }
            setFormData({ name: '', url: '', type: 'RSS', pattern: '' });
            setEditingId(null);
            setIsFormOpen(false);
            fetchSources();
        } catch (error) {
            console.error('Error saving source:', error);
            addToast('Error al guardar la fuente', 'error');
        }
    };

    const handleEdit = (source) => {
        setFormData({
            name: source.name,
            url: source.url,
            type: source.type,
            pattern: source.pattern || ''
        });
        setEditingId(source.id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta fuente?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/sources/${id}`);
            addToast('Fuente eliminada correctamente', 'success');
            fetchSources();
        } catch (error) {
            console.error('Error deleting source:', error);
            addToast('Error al eliminar la fuente', 'error');
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gestión de Fuentes</h1>

            {/* Add Source Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-300 overflow-hidden">
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {editingId ? <Pencil size={20} /> : <Plus size={20} />}
                        {editingId ? 'Editar Fuente' : 'Gestionar Fuente'}
                    </h2>
                    {isFormOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>

                {isFormOpen && (
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    placeholder="Ej. TechCrunch"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                                <input
                                    type="url"
                                    name="url"
                                    value={formData.url}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                >
                                    <option value="RSS">RSS Feed</option>
                                    <option value="HTML">HTML Scraping</option>
                                </select>
                            </div>
                            {formData.type === 'HTML' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patrón (Opcional)</label>
                                    <input
                                        type="text"
                                        name="pattern"
                                        value={formData.pattern}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                        placeholder="Selector CSS para scraping"
                                    />
                                </div>
                            )}
                            <div className="md:col-span-2 flex justify-end mt-2 gap-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormData({ name: '', url: '', type: 'RSS', pattern: '' });
                                            setIsFormOpen(false);
                                        }}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    {editingId ? <Pencil size={18} /> : <Plus size={18} />}
                                    {editingId ? 'Actualizar Fuente' : 'Agregar Fuente'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Sources List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fuentes Configuradas</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Nombre</th>
                                <th className="px-6 py-3">URL</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Patrón</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Cargando fuentes...
                                    </td>
                                </tr>
                            ) : sources.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No hay fuentes configuradas.
                                    </td>
                                </tr>
                            ) : (
                                sources.map((source) => (
                                    <tr key={source.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {source.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={source.url}>
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                {source.url}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${source.type === 'RSS'
                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                }`}>
                                                {source.type === 'RSS' ? <Rss size={12} /> : <Globe size={12} />}
                                                {source.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                                            {source.pattern || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(source)}
                                                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(source.id)}
                                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Settings;
