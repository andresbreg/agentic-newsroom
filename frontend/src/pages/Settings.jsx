import React, { useState } from 'react';
import { Settings as SettingsIcon, Download, Upload, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/system/export');
            if (!response.ok) throw new Error('Export failed');

            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `news_agency_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            addToast('Configuración exportada correctamente', 'success');
        } catch (error) {
            console.error(error);
            addToast('Error al exportar la configuración', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm('¿Estás seguro? Se borrará toda la configuración actual y se reemplazará por la del archivo. Esta acción no se puede deshacer.')) {
            event.target.value = '';
            return;
        }

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = JSON.parse(e.target.result);
                    const response = await fetch('http://localhost:8000/api/system/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(content)
                    });

                    if (response.ok) {
                        addToast('Configuración restaurada correctamente. Recargando...', 'success');
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        throw new Error('Import failed');
                    }
                } catch (err) {
                    addToast('Error al procesar el archivo de respaldo', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            addToast('Error en la restauración', 'error');
        } finally {
            setLoading(false);
            event.target.value = '';
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex items-center gap-3 mb-8">
                <SettingsIcon className="w-8 h-8 text-slate-900 dark:text-white" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ajustes del Sistema</h1>
            </div>

            <div className="max-w-4xl">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            Copia de Seguridad
                        </h2>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                            {/* Export Card */}
                            <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all flex flex-col items-center">
                                <div className="flex items-center justify-center gap-2 mb-3 w-full">
                                    <Download size={22} className="text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg text-center">Exportar Configuración</h3>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-grow text-center">
                                    Descarga un archivo JSON con la configuración actual.
                                </p>
                                <button
                                    onClick={handleExport}
                                    disabled={loading}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={18} />
                                    Exportar
                                </button>
                            </div>

                            {/* Import Card */}
                            <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 group hover:border-green-200 dark:hover:border-green-900/50 transition-all flex flex-col items-center">
                                <div className="flex items-center justify-center gap-2 mb-3 w-full">
                                    <Upload size={22} className="text-green-600 dark:text-green-400" />
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg text-center">Restaurar Configuración</h3>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium text-red-500/80 flex-grow text-center">
                                    Esto borrará la configuración actual.
                                </p>
                                <label className="w-full">
                                    <div className={`w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <Upload size={18} />
                                        Examinar...
                                    </div>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        disabled={loading}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
