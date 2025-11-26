import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import IndividualTab from './tabs/IndividualTab';
import BatchTab from './tabs/BatchTab';
import AdminTab from './tabs/RegistrationsTab';
import ProfileTab from './tabs/ProfileTab';
// MUDANÇA 1: Importando o componente visual correto
import PresetsTab from './components/PresetsTab';
import CardPreview from './components/CardPreview';
import { Dropzone } from './components/Dropzone';
import MobileNav from './components/MobileNav';

import useLocalStorage from './hooks/useLocalStorage';
import { PixData, Template, TemplateWarning, Asset } from './types';
import { validatePixData, generatePixPayload } from './lib/pix';
import { ccbClassicTemplate, allTemplates } from './templates/presets';
import { getPixDataFromForm } from './utils/pixGenerator';
import { DomainProvider } from './context/DomainContext';

const defaultFormData: PixData = {
    name: "CONGREGACAO CRISTA NO BRASIL",
    key: "03.493.231/0001-40",
    city: "SAO PAULO",
    txid: "PIXCCB",
    amount: "",
    displayValue: "R$ ***,00",
    location: "SAO PAULO",
    neighborhood: "",
    bank: "Banco do Brasil - 001",
    agency: "1117-7",
    account: "41.741-6",
    message: "",
};

const AppContent: React.FC = () => {
    const [theme, setTheme] = useLocalStorage('theme', 'light');
    const [activeTab, setActiveTab] = useState('individual');

    // Wrapper para garantir que tabs inválidas voltem para individual
    const handleTabChange = (tab: string) => {
        const validTabs = ['individual', 'templates', 'batch', 'admin', 'profile'];
        if (validTabs.includes(tab)) {
            setActiveTab(tab);
        }
    };

    const [formData, setFormData] = useLocalStorage<PixData>('formData', defaultFormData);

    // Estado Global para Preview
    const [previewData, setPreviewData] = useState<PixData | null>(formData);
    const [previewTemplate, setPreviewTemplate] = useState<Template>(ccbClassicTemplate);
    const [logo, setLogo] = useLocalStorage<string | null>('logo', null);

    // Carrega logo padrão do arquivo public/logo_ccb.svg
    useEffect(() => {
        const loadDefaultLogo = async () => {
            // Se já tem logo salva no localStorage, não carrega a padrão
            if (logo) return;

            try {
                const response = await fetch('/logo_ccb.svg');
                if (response.ok) {
                    const svgText = await response.text();
                    const blob = new Blob([svgText], { type: 'image/svg+xml' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setLogo(base64);
                    };
                    reader.readAsDataURL(blob);
                }
            } catch (error) {
                console.warn('Logo padrão não encontrada em /public/logo_ccb.svg');
            }
        };

        loadDefaultLogo();
    }, []);

    // Garante que o preview inicial tenha dados
    useEffect(() => {
        if (!previewData && formData) {
            setPreviewData(formData);
        }
        // Sincroniza o template do preview com o salvo
        const savedTemplate = localStorage.getItem('template');
        if (savedTemplate) {
            try {
                const parsed = JSON.parse(savedTemplate);
                setPreviewTemplate(parsed);
            } catch (e) { }
        }
    }, []);

    // SEGURANÇA: Se o template salvo estiver bugado, reseta
    useEffect(() => {
        if (previewTemplate && (!previewTemplate.qr || typeof previewTemplate.qr.x !== 'number')) {
            console.warn("Template inválido detectado. Resetando.");
            setPreviewTemplate(ccbClassicTemplate);
        }
    }, [previewTemplate]);

    const handlePreviewData = useCallback((data: PixData | null, template: Template | null) => {
        setPreviewData(data);
        setPreviewTemplate(template || previewTemplate);
    }, [previewTemplate]);

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    const handleLogoDrop = useCallback(async (files: File[]) => {
        const file = files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Logo = reader.result as string;
                setLogo(base64Logo);

                // NOVO: Salvar também no arquivo public/logo_ccb.svg
                try {
                    // Converte base64 de volta para Blob
                    const response = await fetch(base64Logo);
                    const blob = await response.blob();

                    // Cria um elemento <a> para download/substituição
                    // Nota: Em produção, você precisaria de um endpoint backend para isso
                    // Por enquanto, vamos apenas salvar no localStorage
                    console.log('Logo carregada! Para substituir o arquivo físico, você precisaria de um backend.');
                    console.log('Por enquanto, a logo está salva no localStorage e será usada automaticamente.');

                    // Alternativa: Oferecer download para usuário substituir manualmente
                    // const url = URL.createObjectURL(blob);
                    // const a = document.createElement('a');
                    // a.href = url;
                    // a.download = 'logo_ccb.svg';
                    // a.click();
                    // URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Erro ao processar logo:', error);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [setLogo]);

    // Cálculos Globais (Sempre usam o estado de PREVIEW para garantir que o que você vê é o real)
    const pixDataForPayload = useMemo(() => getPixDataFromForm(previewTemplate, previewData || defaultFormData), [previewTemplate, previewData]);
    const errors = useMemo(() => validatePixData(pixDataForPayload), [pixDataForPayload]);
    const payload = useMemo(() => {
        return Object.keys(errors).length === 0 ? generatePixPayload(pixDataForPayload) : null;
    }, [errors, pixDataForPayload]);

    const warnings = useMemo((): TemplateWarning[] => {
        const warns: TemplateWarning[] = [];
        const combinedText =
            (previewTemplate?.blocks || [])
                .flatMap(b => (b.type === 'text' ? [b.text] : []))
                .join(' ') +
            ' ' +
            Object.values(previewTemplate?.assets || {})
                .map(a => (a as Asset).source)
                .join(' ');

        const placeholders = combinedText.match(/\{\{(\w+)\}\}/g) || [];
        // Campos que são computados/opcionais e não devem gerar warning
        const ignoredFields = ['finalityOrTxid', 'logo', 'displayValue', 'message'];

        for (const p of placeholders) {
            const key = p.replace(/\{|\}/g, '');
            // Ignora campos computados ou opcionais
            if (ignoredFields.includes(key)) continue;

            // Verifica no previewData ou no formData como fallback
            const val = previewData?.[key as keyof PixData] || formData?.[key as keyof PixData];
            if (!val) {
                warns.push({ type: 'placeholder', key });
            }
        }
        return warns;
    }, [previewTemplate, previewData, formData]);

    const handleSelectTemplate = (t: Template) => {
        setPreviewTemplate(t);
        // Salva no localStorage para persistir a escolha
        localStorage.setItem('template', JSON.stringify(t));
    };

    return (
        <div className="bg-background text-foreground min-h-screen">
            <Header theme={theme} toggleTheme={toggleTheme} />
            <main className="container mx-auto p-4 md:p-8">
                <div className="flex border-b mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('individual')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'individual' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Individual</button>
                    <button onClick={() => setActiveTab('batch')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'batch' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Em Lote</button>
                    <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'admin' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Administração</button>
                    <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'templates' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Templates</button>
                    <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Perfil</button>
                </div>

                {activeTab === 'individual' && (
                    <IndividualTab
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        payload={payload}
                        template={previewTemplate}
                        logo={logo}
                        warnings={warnings}
                        onPreviewData={handlePreviewData}
                    />
                )}

                {activeTab === 'batch' && (
                    <BatchTab
                        template={previewTemplate}
                        logo={logo}
                        onPreviewData={handlePreviewData}
                    />
                )}

                {activeTab === 'admin' && <AdminTab />}

                {/* Nova aba de Perfil */}
                {activeTab === 'profile' && (
                    <ProfileTab
                        theme={theme}
                        onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    />
                )}

                {/* ABA TEMPLATES REFORMULADA (Layout 50/50) */}
                {activeTab === 'templates' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Coluna Esquerda: Lista de Templates e Upload */}
                        <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-6">
                            <PresetsTab
                                templates={allTemplates}
                                selectedTemplate={previewTemplate}
                                onSelectTemplate={handleSelectTemplate}
                            />
                            <div className="space-y-2 pt-4 border-t">
                                <label className="text-sm font-medium">Logo Personalizada (Opcional)</label>
                                <Dropzone
                                    onDrop={handleLogoDrop}
                                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.svg'] }}
                                    label="Clique ou arraste a logo aqui"
                                    description="Substitui o placeholder {{logo}} no cartão."
                                />
                                {logo && (
                                    <div className="mt-4 relative group border rounded p-2 inline-block">
                                        <img src={logo} alt="Logo preview" className="h-12" />
                                        <button onClick={() => setLogo(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm hover:bg-red-600">X</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coluna Direita: Preview Sticky */}
                        <div className="space-y-8 sticky top-24">
                            <div className="border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50 shadow-sm">
                                <h3 className="text-sm font-bold mb-4 uppercase text-muted-foreground">Visualização do Template</h3>
                                <CardPreview
                                    template={previewTemplate}
                                    // Usa previewData se existir, senão usa formData, senão um objeto vazio
                                    formData={previewData || formData || defaultFormData}
                                    logo={logo}
                                    payload={payload}
                                    warnings={warnings}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                                <p>Selecione um template à esquerda para visualizar.</p>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* Menu Mobile */}
            <MobileNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <DomainProvider>
            <AppContent />
        </DomainProvider>
    );
}

export default App;