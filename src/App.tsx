import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import IndividualTab from './tabs/IndividualTab';
import BatchTab from './tabs/BatchTab';
import AdminTab from './tabs/RegistrationsTab';
// MUDANÇA 1: Importando o componente visual correto
import PresetsTab from './components/PresetsTab'; 
import CardPreview from './components/CardPreview'; 
import { Dropzone } from './components/Dropzone';

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
    const [theme, setTheme] = useLocalStorage('theme', 'dark');
    const [activeTab, setActiveTab] = useState('individual');
    
    const [formData, setFormData] = useLocalStorage<PixData>('formData', defaultFormData);
    
    // Estado Global para Preview
    const [previewData, setPreviewData] = useState<PixData | null>(formData);
    const [previewTemplate, setPreviewTemplate] = useState<Template>(ccbClassicTemplate);
    const [logo, setLogo] = useLocalStorage<string | null>('logo', null);
    
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
             } catch (e) {}
        }
    }, []);

    // SEGURANÇA: Se o template salvo estiver bugado, reseta
    useEffect(() => {
        if (previewTemplate && (!previewTemplate.qr || typeof previewTemplate.qr.x !== 'number')) {
            console.warn("Template inválido detectado. Resetando.");
            setPreviewTemplate(ccbClassicTemplate);
        }
    }, [previewTemplate]);

    const handlePreviewData = useCallback((data: PixData | null, template: Template) => {
        setPreviewData(data);
        setPreviewTemplate(template);
    }, []);

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    const handleLogoDrop = useCallback((files: File[]) => {
        const file = files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogo(e.target?.result as string);
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
        for (const p of placeholders) {
            const key = p.replace(/\{|\}/g, '');
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
                                        <img src={logo} alt="Logo preview" className="h-12"/>
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