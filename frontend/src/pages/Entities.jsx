import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Trash2, Plus, Database, Pencil,
    X, User, Building2, MapPin, Lightbulb,
    CheckCircle2, Link2, Info, EyeOff, Eye,
    LayoutGrid, Search
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

const ENTITY_TYPES = [
    { id: 'PERSON', name: 'Persona', icon: User, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/8 dark:bg-blue-500/15', borderColor: 'border-blue-200 dark:border-blue-800' },
    { id: 'ORGANIZATION', name: 'Organización', icon: Building2, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/8 dark:bg-purple-500/15', borderColor: 'border-purple-200 dark:border-purple-800' },
    { id: 'LOCATION', name: 'Lugar', icon: MapPin, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/8 dark:bg-emerald-500/15', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    { id: 'CONCEPT', name: 'Concepto', icon: Lightbulb, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/8 dark:bg-amber-500/15', borderColor: 'border-amber-200 dark:border-amber-800' },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
        source_ids: []
    });
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'ignored'
    const [selectedType, setSelectedType] = useState(null);
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [entitiesRes, sourcesRes] = await Promise.all([
                axios.get('http://localhost:8000/api/entities?include_ignored=true'),
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
        setFormData({ name: '', type: 'PERSON', source_ids: [] });
        setEditingId(null);
        setIsModalOpen(false);
    };

    const handleEdit = (entity) => {
        setFormData({
            name: entity.name,
            type: entity.type,
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

    const handleToggleIgnore = async (id) => {
        try {
            await axios.put(`http://localhost:8000/api/entities/${id}/ignore`);
            addToast('Estado de entidad actualizado', 'success');
            fetchData();
        } catch (error) {
            console.error('Error toggling ignore:', error);
            addToast('Error al actualizar entidad', 'error');
        }
    };

    const getTypeDetails = (typeId) => ENTITY_TYPES.find(t => t.id === typeId) || ENTITY_TYPES[0];

    const filteredEntities = useMemo(() => {
        return entities
            .filter(e => activeTab === 'active' ? !e.is_ignored : e.is_ignored)
            .filter(e => {
                if (selectedType && e.type !== selectedType) return false;
                if (selectedLetter && !e.name.toUpperCase().startsWith(selectedLetter)) return false;
                if (searchTerm && !e.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [entities, activeTab, selectedType, selectedLetter, searchTerm]);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Database className="w-6 h-6 text-indigo-600" />
                        Gestión de Entidades
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Catálogo de identidades rastreadas por el sistema.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={20} />
                    Nueva Entidad
                </button>
            </div>

            {/* Filter Tools Row */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={cn(
                                "px-6 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2",
                                activeTab === 'active'
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                            )}
                        >
                            <Eye size={16} />
                            Activas ({entities.filter(e => !e.is_ignored).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('ignored')}
                            className={cn(
                                "px-6 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2",
                                activeTab === 'ignored'
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                            )}
                        >
                            <EyeOff size={16} />
                            Ignoradas ({entities.filter(e => e.is_ignored).length})
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                        />
                    </div>
                </div>

                {/* Alphabet Filter */}
                <div className="flex flex-wrap justify-center gap-0.5">
                    <button
                        onClick={() => setSelectedLetter(null)}
                        className={cn(
                            "w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                            !selectedLetter ? "bg-indigo-600 text-white shadow-sm" : "bg-white dark:bg-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                        title="Ver Todas"
                    >
                        <LayoutGrid size={12} />
                    </button>
                    {ALPHABET.map(letter => (
                        <button
                            key={letter}
                            onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                            className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all",
                                selectedLetter === letter
                                    ? "bg-indigo-600 text-white shadow-sm scale-110 z-10"
                                    : "bg-white dark:bg-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {ENTITY_TYPES.map(type => {
                        const Icon = type.icon;
                        const isActive = selectedType === type.id;
                        const count = entities.filter(e => e.type === type.id && (activeTab === 'active' ? !e.is_ignored : e.is_ignored)).length;

                        return (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(isActive ? null : type.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left",
                                    isActive
                                        ? `${type.borderColor} ${type.bgColor} shadow-lg shadow-${type.id.toLowerCase()}-500/10`
                                        : "bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                )}
                            >
                                <div className={cn("p-2 rounded-xl flex items-center gap-2.5 shrink-0", type.bgColor)}>
                                    <span className={cn("text-lg font-black leading-none", type.color)}>{count}</span>
                                    <Icon className={type.color} size={20} />
                                </div>
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{type.name}</h3>
                            </button>
                        );
                    })}
                </div>

                {/* Entities Grouped Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Cargando entidades...</p>
                        </div>
                    ) : filteredEntities.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sin coincidencias</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">No se encontraron entidades con los filtros aplicados.</p>
                        </div>
                    ) : (
                        filteredEntities.map((entity) => {
                            const typeDetails = getTypeDetails(entity.type);
                            const Icon = typeDetails.icon;
                            return (
                                <div
                                    key={entity.id}
                                    className={cn(
                                        "group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 p-2.5 hover:shadow-md hover:shadow-indigo-500/5 transition-all relative overflow-hidden flex items-center justify-between gap-3",
                                        entity.is_ignored && "opacity-60"
                                    )}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={cn("p-1.5 rounded-lg shrink-0", typeDetails.bgColor)}>
                                            <Icon className={typeDetails.color} size={14} />
                                        </div>
                                        <h3 className={cn(
                                            "text-sm font-bold truncate",
                                            entity.is_ignored ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"
                                        )}>
                                            {entity.name}
                                        </h3>
                                    </div>
                                    <div className="flex gap-0.5 shrink-0">
                                        <button
                                            onClick={() => handleToggleIgnore(entity.id)}
                                            className={cn(
                                                "p-1 rounded-md transition-colors",
                                                entity.is_ignored ? "text-green-500 hover:bg-green-50 dark:hover:bg-green-950/40" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                                            )}
                                            title={entity.is_ignored ? 'Restaurar' : 'Ignorar'}
                                        >
                                            {entity.is_ignored ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(entity)}
                                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entity.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Entity Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Editar Entidad' : 'Nueva Entidad'}
                            </h2>
                            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                        placeholder="Ej: Elon Musk, OpenAI..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ENTITY_TYPES.map(type => {
                                            const Icon = type.icon;
                                            const isSelected = formData.type === type.id;
                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, type: type.id })}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                                                        isSelected
                                                            ? `${type.borderColor} ${type.bgColor} shadow-sm`
                                                            : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                                    )}
                                                >
                                                    <Icon className={type.color} size={18} />
                                                    <span className={cn("text-xs font-bold", isSelected ? "text-gray-900 dark:text-white" : "text-gray-500")}>
                                                        {type.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2.5 text-gray-500 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    {editingId ? 'Actualizar' : 'Crear'}
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
