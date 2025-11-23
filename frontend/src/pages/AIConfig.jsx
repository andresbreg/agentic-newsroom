import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bot, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AIConfig = () => {
    const { addToast } = useToast();
    const [aiConfig, setAiConfig] = useState({
        gemini_api_key: '',
        system_instructions: ''
    });
    const [loading, setLoading] = useState(true);

    const fetchAiConfig = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/config');
            setAiConfig({
                gemini_api_key: response.data.api_key || '',
                system_instructions: response.data.system_prompt || ''
            });
        } catch (error) {
            console.error('Error fetching AI config:', error);
            addToast('Error al cargar configuración', 'error');
        } finally {
            setLoading(false);
        }
    };

    const saveAiConfig = async () => {
        try {
            await axios.post('http://localhost:8000/api/config', {
                api_key: aiConfig.gemini_api_key,
                system_prompt: aiConfig.system_instructions
            });
            addToast('Configuración IA guardada', 'success');
            fetchAiConfig();
        } catch (error) {
            console.error('Error saving AI config:', error);
            addToast('Error al guardar configuración IA', 'error');
        }
    };

    useEffect(() => {
        fetchAiConfig();
    }, []);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
                <Bot className="w-6 h-6 text-slate-900 dark:text-white" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agente IA</h1>
            </div>

            <div className="max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gemini API Key</label>
                        <input
                            type="password"
                            value={aiConfig.gemini_api_key}
                            onChange={(e) => setAiConfig(prev => ({ ...prev, gemini_api_key: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                            placeholder="Enter your Gemini API Key"
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Tu API Key se almacena localmente y se usa sólo para comunicarse con el agente.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instrucciones del Sistema</label>
                        <textarea
                            value={aiConfig.system_instructions}
                            onChange={(e) => setAiConfig(prev => ({ ...prev, system_instructions: e.target.value }))}
                            rows={8}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors font-mono text-sm"
                            placeholder="Define la personalidad y reglas del agente..."
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Estas instrucciones guiarán al agente al analizar y redactar noticias.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={saveAiConfig}
                            className="h-10 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                        >
                            <Save size={20} />
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIConfig;
