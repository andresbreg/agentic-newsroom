import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, Tag, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Tags = () => {
    const { addToast } = useToast();
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        color: 'blue',
        description: ''
    });

    const colors = [
        { name: 'Rojo', value: 'red' },
        { name: 'Naranja', value: 'orange' },
        { name: 'Ámbar', value: 'amber' },
        { name: 'Verde', value: 'green' },
        { name: 'Azul', value: 'blue' },
        { name: 'Índigo', value: 'indigo' },
        { name: 'Púrpura', value: 'purple' },
        { name: 'Rosa', value: 'pink' },
        { name: 'Gris', value: 'slate' }
    ];

    const fetchTags = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/tags');
            setTags(response.data);
        } catch (error) {
            console.error('Error fetching tags:', error);
            addToast('Error al cargar las etiquetas', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`http://localhost:8000/api/tags/${editingId}`, formData);
                addToast('Etiqueta actualizada correctamente', 'success');
            } else {
                await axios.post('http://localhost:8000/api/tags', formData);
                addToast('Etiqueta creada correctamente', 'success');
            }
            setFormData({ name: '', color: 'blue', description: '' });
            setEditingId(null);
            setIsFormOpen(false);
            fetchTags();
        } catch (error) {
            console.error('Error saving tag:', error);
            addToast('Error al guardar la etiqueta', 'error');
        }
    };

    const handleEdit = (tag) => {
        setFormData({
            name: tag.name,
            color: tag.color,
            description: tag.description || ''
        });
        setEditingId(tag.id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta etiqueta?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/tags/${id}`);
            addToast('Etiqueta eliminada correctamente', 'success');
            fetchTags();
        } catch (error) {
            console.error('Error deleting tag:', error);
            addToast('Error al eliminar la etiqueta', 'error');
        }
    };

    const getBadgeColor = (color) => {
        const map = {
            red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
            green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
            purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
            slate: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
        };
        return map[color] || map.blue;
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
                <Tag className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Etiquetas</h1>
            </div>

            {/* Add Tag Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-300 overflow-hidden">
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {editingId ? <Pencil size={20} /> : <Plus size={20} />}
                        {editingId ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
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
                                    placeholder="Ej. Economía"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                                <select
                                    name="color"
                                    value={formData.color}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                >
                                    {colors.map(c => (
                                        <option key={c.value} value={c.value}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    placeholder="Descripción opcional de la etiqueta..."
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end mt-2 gap-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormData({ name: '', color: 'blue', description: '' });
                                            setIsFormOpen(false);
                                        }}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="h-10 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    {editingId ? <Pencil size={18} /> : <Plus size={18} />}
                                    {editingId ? 'Actualizar' : 'Crear Etiqueta'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Tags List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lista de Etiquetas</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Etiqueta</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Cargando etiquetas...
                                    </td>
                                </tr>
                            ) : tags.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No hay etiquetas creadas.
                                    </td>
                                </tr>
                            ) : (
                                tags.map((tag) => (
                                    <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(tag.color)}`}>
                                                {tag.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {tag.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(tag)}
                                                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tag.id)}
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

export default Tags;
