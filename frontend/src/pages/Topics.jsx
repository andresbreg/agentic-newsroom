import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Plus, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Topics = () => {
    const { addToast } = useToast();
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [currentTopic, setCurrentTopic] = useState({
        subject: '',
        scope: '',
        keywords: '',
        exclusions: '',
        relevance_level: 'Medium',
        context_tags: ''
    });

    const fetchTopics = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/topics');
            setTopics(response.data);
        } catch (error) {
            console.error('Error fetching topics:', error);
            addToast('Error al cargar temas de interés', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (topic) => {
        setCurrentTopic(topic);
        setEditingId(topic.id);
        setIsFormOpen(true);
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setCurrentTopic({
            subject: '',
            scope: '',
            keywords: '',
            exclusions: '',
            relevance_level: 'Medium',
            context_tags: ''
        });
    };

    const handleSaveTopic = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`http://localhost:8000/api/topics/${editingId}`, currentTopic);
                addToast('Tema actualizado', 'success');
            } else {
                await axios.post('http://localhost:8000/api/topics', currentTopic);
                addToast('Tema creado', 'success');
            }
            fetchTopics();
            handleCancel();
        } catch (error) {
            console.error('Error saving topic:', error);
            addToast('Error al guardar tema', 'error');
        }
    };

    const handleDeleteTopic = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este tema?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/topics/${id}`);
            addToast('Tema eliminado', 'success');
            fetchTopics();
        } catch (error) {
            console.error('Error deleting topic:', error);
            addToast('Error al eliminar tema', 'error');
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
                <Target className="w-6 h-6 text-slate-900 dark:text-white" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Temas</h1>
            </div>

            {/* Add Topic Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-300 overflow-hidden">
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {editingId ? <Pencil size={20} /> : <Plus size={20} />}
                        {editingId ? 'Gestionar Tema' : 'Agregar Tema'}
                    </h2>
                    {isFormOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>

                {isFormOpen && (
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                        <form onSubmit={handleSaveTopic} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asunto</label>
                                <input
                                    type="text"
                                    required
                                    value={currentTopic.subject}
                                    onChange={(e) => setCurrentTopic({ ...currentTopic, subject: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    placeholder="Ej: Elecciones 2024"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nivel de Relevancia</label>
                                <select
                                    value={currentTopic.relevance_level}
                                    onChange={(e) => setCurrentTopic({ ...currentTopic, relevance_level: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                >
                                    <option value="High">Alta</option>
                                    <option value="Medium">Media</option>
                                    <option value="Low">Baja</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alcance</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={currentTopic.scope}
                                    onChange={(e) => setCurrentTopic({ ...currentTopic, scope: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    placeholder="Descripción detallada de lo que se busca..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Palabras Clave (separadas por coma)</label>
                                <input
                                    type="text"
                                    required
                                    value={currentTopic.keywords}
                                    onChange={(e) => setCurrentTopic({ ...currentTopic, keywords: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    placeholder="Ej: votación, candidatos, urnas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exclusiones (separadas por coma)</label>
                                <input
                                    type="text"
                                    value={currentTopic.exclusions || ''}
                                    onChange={(e) => setCurrentTopic({ ...currentTopic, exclusions: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    placeholder="Ej: deportes, espectáculos"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contexto/Entidades</label>
                                <input
                                    type="text"
                                    value={currentTopic.context_tags || ''}
                                    onChange={(e) => setCurrentTopic({ ...currentTopic, context_tags: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    placeholder="Ej: CNE, Partidos Políticos"
                                />
                            </div>

                            <div className="col-span-2 flex justify-end mt-2 gap-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
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
                                    {editingId ? 'Actualizar Tema' : 'Agregar Tema'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Topics List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lista de Temas</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Asunto</th>
                                <th className="px-6 py-3">Alcance</th>
                                <th className="px-6 py-3">Relevancia</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Cargando temas...
                                    </td>
                                </tr>
                            ) : topics.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No hay temas configurados.
                                    </td>
                                </tr>
                            ) : (
                                topics.map((topic) => (
                                    <tr key={topic.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                            {topic.subject}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={topic.scope}>
                                            {topic.scope}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${topic.relevance_level === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                topic.relevance_level === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {topic.relevance_level === 'High' ? 'Alta' : topic.relevance_level === 'Medium' ? 'Media' : 'Baja'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(topic)}
                                                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTopic(topic.id)}
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

export default Topics;
