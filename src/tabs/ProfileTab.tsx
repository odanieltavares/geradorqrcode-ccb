import React, { useState, useEffect } from 'react';
import { User, Settings, BarChart3, Info, Moon, Sun, Download, Trash2, HardDrive } from 'lucide-react';

interface ProfileTabProps {
    theme?: string;
    onThemeToggle?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ theme = 'light', onThemeToggle }) => {
    const [storageSize, setStorageSize] = useState(0);
    const [itemCount, setItemCount] = useState(0);

    useEffect(() => {
        calculateStorageStats();
    }, []);

    const calculateStorageStats = () => {
        try {
            let totalSize = 0;
            let count = 0;

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                    count++;
                }
            }

            setStorageSize(totalSize);
            setItemCount(count);
        } catch (e) {
            console.error('Erro ao calcular storage:', e);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const getStoragePercentage = () => {
        const maxSize = 5 * 1024 * 1024; // 5MB estimado
        return Math.min((storageSize / maxSize) * 100, 100);
    };

    const exportAllData = () => {
        try {
            const allData: Record<string, any> = {};
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    try {
                        allData[key] = JSON.parse(localStorage[key]);
                    } catch {
                        allData[key] = localStorage[key];
                    }
                }
            }

            const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `perfil_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Erro ao exportar dados');
        }
    };

    const clearAllData = () => {
        if (window.confirm('⚠️ Tem certeza que deseja limpar TODOS os dados do sistema?\n\nIsso irá remover:\n- Cadastros de igrejas\n- Templates personalizados\n- Configurações\n- Histórico\n\nEsta ação NÃO pode ser desfeita!')) {
            if (window.confirm('Última confirmação: Todos os dados serão perdidos. Continuar?')) {
                localStorage.clear();
                window.location.reload();
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={32} className="text-primary" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-2">Perfil do Sistema</h1>
                        <p className="text-muted-foreground">
                            Gerador de QR Code PIX para Congregação Cristã no Brasil
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card: Informações do Sistema */}
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Info size={20} className="text-primary" />
                        <h2 className="text-lg font-semibold">Informações do Sistema</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Versão</span>
                            <span className="font-mono text-sm font-semibold">v2.0.0</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Última Atualização</span>
                            <span className="text-sm">23/11/2024</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-muted-foreground">Templates Disponíveis</span>
                            <span className="text-sm font-semibold">2 (CCB Clássico + Minimalista)</span>
                        </div>
                    </div>
                </div>

                {/* Card: Estatísticas */}
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={20} className="text-primary" />
                        <h2 className="text-lg font-semibold">Estatísticas de Uso</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Itens Salvos</span>
                            <span className="font-semibold">{itemCount}</span>
                        </div>
                        <div className="py-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground">Armazenamento Usado</span>
                                <span className="text-sm font-semibold">{formatBytes(storageSize)}</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getStoragePercentage() > 80 ? 'bg-red-500' :
                                            getStoragePercentage() > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                    style={{ width: `${getStoragePercentage()}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {getStoragePercentage().toFixed(1)}% de ~5MB
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card: Preferências */}
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings size={20} className="text-primary" />
                        <h2 className="text-lg font-semibold">Preferências</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                            <div className="flex items-center gap-2">
                                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                                <span className="text-sm">Tema</span>
                            </div>
                            <button
                                onClick={onThemeToggle}
                                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors text-sm font-medium"
                            >
                                {theme === 'dark' ? 'Escuro' : 'Claro'}
                            </button>
                        </div>
                        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                            <p>💡 Dica: Use Ctrl+S (ou Cmd+S) para salvar rapidamente seus dados.</p>
                        </div>
                    </div>
                </div>

                {/* Card: Gerenciar Dados */}
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <HardDrive size={20} className="text-primary" />
                        <h2 className="text-lg font-semibold">Gerenciar Dados</h2>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={exportAllData}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors font-medium"
                        >
                            <Download size={18} />
                            Exportar Todos os Dados
                        </button>
                        <button
                            onClick={clearAllData}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-md transition-colors font-medium"
                        >
                            <Trash2 size={18} />
                            Limpar Todos os Dados
                        </button>
                        <p className="text-xs text-muted-foreground">
                            ⚠️ A limpeza de dados é irreversível. Exporte um backup antes de limpar.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm text-center">
                <p className="text-sm text-muted-foreground mb-2">
                    Sistema desenvolvido para facilitar a geração de QR Codes PIX
                </p>
                <p className="text-xs text-muted-foreground">
                    © 2024 Congregação Cristã no Brasil • Versão 2.0.0
                </p>
            </div>
        </div>
    );
};

export default ProfileTab;
