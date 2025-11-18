import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import IndividualTab from './tabs/IndividualTab';
import BatchTab from './tabs/BatchTab';
import AdminTab from './tabs/RegistrationsTab';
import TemplatesTab from './tabs/TemplatesTab';
import { Dropzone } from './components/Dropzone';
import useLocalStorage from './hooks/useLocalStorage';
import { PixData, Template, TemplateWarning, Preset, Asset } from './types';
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

// Componente AppContent modificado para incluir o estado de Preview
const AppContent: React.FC = () => {
    const [theme, setTheme] = useLocalStorage('theme', 'dark');
    const [activeTab, setActiveTab] = useState('individual');
    
    // Estado do Formulário
    const [formData, setFormData] = useLocalStorage<PixData>('formData', defaultFormData);
    
    // Estado Global para Preview (Corrigindo o Bug de Atualização Lenta)
    const [previewData, setPreviewData] = useState<PixData | null>(formData);
    const [previewTemplate, setPreviewTemplate] = useState<Template>(ccbClassicTemplate);
    
    const [logo, setLogo] = useLocalStorage<string | null>('logo', null);
    
    // Função para as abas Individual e Batch chamarem para forçar a atualização do preview
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

    // Recalcula o payload e erros com base no ESTADO DE PREVIEW (previewData)
    const pixDataForPayload = useMemo(() => getPixDataFromForm(previewTemplate, previewData || {} as PixData), [previewTemplate, previewData]);
    const errors = useMemo(() => validatePixData(pixDataForPayload), [pixDataForPayload]);
    const payload = useMemo(() => {
        return Object.keys(errors).length === 0 ? generatePixPayload(pixDataForPayload) : null;
    }, [errors, pixDataForPayload]);

    // Recalcula Warnings
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
            if (!previewData?.[key as keyof PixData]) {
                warns.push({ type: 'placeholder', key });
            }
        }
        return warns;
    }, [previewTemplate, previewData]);
    
    // Handler para Template Tab
    const handleSelectTemplate = (t: Template) => {
        setPreviewTemplate(t);
        // Atualiza o template no IndividualTab/FormData também se necessário
        // Neste modelo, o previewTemplate é o mestre.
        // O previewData atual será re-renderizado com o novo template.
    };


    return (
        <div className="bg-background text-foreground min-h-screen">
            <Header theme={theme} toggleTheme={toggleTheme} />
            <main className="container mx-auto p-4 md:p-8">
                <div className="flex border-b mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('individual')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'individual' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Individual (Hierárquico)</button>
                    <button onClick={() => setActiveTab('batch')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'batch' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Em Lote</button>
                    <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'admin' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Administração / Dados</button>
                    <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'templates' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Templates</button>
                </div>

                {/* Individual Tab (Passando o handler de preview) */}
                {activeTab === 'individual' && (
                    <IndividualTab 
                        formData={formData} 
                        setFormData={setFormData}
                        errors={errors} // Erros e Payload baseados no Preview
                        payload={payload}
                        template={previewTemplate}
                        logo={logo}
                        warnings={warnings}
                        onPreviewData={handlePreviewData}
                    />
                )}
                
                {/* Batch Tab (Passando o handler de preview) */}
                {activeTab === 'batch' && (
                    <BatchTab 
                        template={previewTemplate} 
                        logo={logo} 
                        onPreviewData={handlePreviewData}
                    />
                )}

                {/* Admin Tab */}
                {activeTab === 'admin' && <AdminTab />} 
                
                {/* Templates Tab (Mantém a lógica de logo e template) */}
                {activeTab === 'templates' && (
                    <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-6">
                        <TemplatesTab templates={allTemplates} selectedTemplate={previewTemplate} onSelectTemplate={handleSelectTemplate} />
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Logo (Opcional)</label>
                            <Dropzone
                                onDrop={handleLogoDrop}
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.svg'] }}
                                label="Clique ou arraste a logo aqui"
                                description="PNG, JPG, SVG. Será usada no lugar do placeholder {{logo}}."
                            />
                            {logo && (
                                <div className="mt-4 relative group">
                                    <p className="text-sm font-medium mb-2">Preview da Logo:</p>
                                    <img src={logo} alt="Logo preview" className="h-16 bg-zinc-200 p-1 rounded"/>
                                    <button onClick={() => setLogo(null)} className="absolute top-6 left-0 h-16 w-full bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs">Remover</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Card, QR e Payload Previews Globais */}
                {activeTab !== 'templates' && (
                    <div className="sticky top-24 lg:col-span-1 hidden lg:block">
                        <h3 className="text-lg font-bold mb-4">Preview Global</h3>
                        <CardPreview
                            template={previewTemplate}
                            formData={previewData || {} as PixData}
                            logo={logo}
                            payload={payload}
                            warnings={warnings}
                        />
                        <div className="mt-8 space-y-4">
                            <QrPreview qrCodeValue={payload || undefined} txid={previewData?.txid} />
                            <PayloadPreview payload={payload || undefined} txid={previewData?.txid} />
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