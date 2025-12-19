import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Trash2, Plus, Database, Pencil,
    X, User, Building2, MapPin, Lightbulb,
    CheckCircle2, Link2, Info
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ENTITY_TYPES = [
    { id: 'PERSON', name: 'Persona', icon: User, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/20' },
    { id: 'ORGANIZATION', name: 'Organización', icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950/20' },
    { id: 'LOCATION', name: 'Lugar', icon: MapPin, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { id: 'CONCEPT', name: 'Concepto', icon: Lightbulb, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/20' },
];

const Entities = () => {
    const { addToast } = useToast();
    const [entities, setEntities] = useState([]);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'PERSON',
        description: '',
        source_ids: []
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [entitiesRes, sourcesRes] = await Promise.all([
                axios.get('http://localhost:8000/api/entities'),
                axios.get('http://localhost:8000/api/sources')
            ]);
            setEntities(entitiesRes.data);
            setSources(sourcesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            addToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', type: 'PERSON', description: '', source_ids: [] });
        setEditingId(null);
        setIsModalOpen(false);
    };

    const handleEdit = (entity) => {
        setFormData({
            name: entity.name,
            type: entity.type,
            description: entity.description || '',
            source_ids: entity.sources.map(s => s.id)
        });
        setEditingId(entity.id);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`http://localhost:8000/api/entities/${editingId}`, formData);
                addToast('Entidad actualizada correctamente', 'success');
            } else {
                await axios.post('http://localhost:8000/api/entities', formData);
                addToast('Entidad creada correctamente', 'success');
            }
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving entity:', error);
            addToast('Error al guardar la entidad', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta entidad?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/entities/${id}`);
            addToast('Entidad eliminada correctamente', 'success');
            fetchData();
        } catch (error) {
            console.error('Error deleting entity:', error);
            addToast('Error al eliminar la entidad', 'error');
        }
    };

    const toggleSourceLink = (sourceId) => {
        setFormData(prev => ({
            ...prev,
            source_ids: prev.source_ids.includes(sourceId)
                ? prev.source_ids.filter(id => id !== sourceId)
                : [...prev.source_ids, sourceId]
        }));
    };

    const getTypeDetails = (typeId) => ENTITY_TYPES.find(t => t.id === typeId) || ENTITY_TYPES[0];

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Database className="w-8 h-8 text-indigo-500" />
                        Directorio de Entidades
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona actores clave y conceptos vinculados a tus fuentes de inteligencia.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={20} />
                    Nueva Entidad
                </button>
            </div>

            {/* Entities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Cargando entidades...</p>
                    </div>
                ) : entities.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sin entidades registradas</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Comienza agregando personas, organizaciones o conceptos clave.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-indigo-600 font-medium mt-4 hover:underline"
                        >
                            Crear Entidad
                        </button>
                    </div>
                ) : (
                    entities.map((entity) => {
                        const typeDetails = getTypeDetails(entity.type);
                        const Icon = typeDetails.icon;
                        return (
                            <div
                                key={entity.id}
                                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-lg hover:shadow-indigo-500/5 transition-all relative overflow-hidden flex flex-col justify-center"
                                style={{ minHeight: '160px' }}
                            >
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(entity)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entity.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate pr-14 mb-3" title={entity.name}>
                                    {entity.name}
                                </h3>

                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <Icon className={`w-4 h-4 ${typeDetails.color}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeDetails.bgColor} ${typeDetails.color}`}>
                                            {typeDetails.name}
                                        </span>
                                    </div>

                                    {entity.sources.length > 0 && (
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                                            <Link2 size={12} />
                                            {entity.sources.length} Fuentes
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1 italic">
                                    {entity.description || 'Sin descripción disponible.'}
                                </p>

                                {entity.sources.length > 0 && (
                                    <div className="pt-3 border-t border-gray-50 dark:border-gray-700/50">
                                        <div className="flex flex-wrap gap-1">
                                            {entity.sources.slice(0, 2).map(source => (
                                                <span key={source.id} className="text-[9px] px-1.5 py-0.5 bg-gray-50 dark:bg-gray-900 text-gray-500 rounded border border-gray-100 dark:border-gray-800 truncate max-w-[80px]">
                                                    {source.name}
                                                </span>
                                            ))}
                                            {entity.sources.length > 2 && (
                                                <span className="text-[9px] px-1.5 py-0.5 text-gray-400">
                                                    +{entity.sources.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Editar Entidad' : 'Nueva Entidad'}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                            placeholder="Nombre de la entidad"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                        >
                                            {ENTITY_TYPES.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows="4"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-gray-900 dark:text-white resize-none"
                                            placeholder="Detalles sobre esta entidad..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Link2 size={16} className="text-indigo-500" />
                                        Vincular Fuentes
                                    </label>
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 h-[260px] overflow-y-auto">
                                        {sources.length === 0 ? (
                                            <p className="text-xs text-center text-gray-400 mt-10">No hay fuentes disponibles para vincular.</p>
                                        ) : (
                                            sources.map(source => (
                                                <button
                                                    key={source.id}
                                                    type="button"
                                                    onClick={() => toggleSourceLink(source.id)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${formData.source_ids.includes(source.id)
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-200'
                                                        }`}
                                                >
                                                    <span className="text-xs font-medium truncate pr-4">{source.name}</span>
                                                    {formData.source_ids.includes(source.id) ? (
                                                        <CheckCircle2 size={14} className="shrink-0" />
                                                    ) : (
                                                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"></div>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 flex items-center gap-1.5 px-2">
                                        <Info size={12} />
                                        Vincular fuentes ayuda al sistema a contextualizar la información.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                                >
                                    {editingId ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                                    {editingId ? 'Guardar Cambios' : 'Crear Entidad'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Entities;
