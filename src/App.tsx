
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

const AppContent: React.FC = () => {
    const [theme, setTheme] = useLocalStorage('theme', 'dark');
    const [activeTab, setActiveTab] = useState('individual');
    const [formData, setFormData] = useLocalStorage<PixData>('formData', defaultFormData);
    const [logo, setLogo] = useLocalStorage<string | null>('logo', null);
    // Presets are now less relevant with the new Admin tab, but kept for BatchTab compat if needed
    const [presets, setPresets] = useLocalStorage<Preset[]>('presets', []); 
    const [template, setTemplate] = useLocalStorage<Template>('template', ccbClassicTemplate);

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

    const pixDataForPayload = useMemo(() => getPixDataFromForm(template, formData), [template, formData]);
    const errors = useMemo(() => validatePixData(pixDataForPayload), [pixDataForPayload]);
    const payload = useMemo(() => {
        return Object.keys(errors).length === 0 ? generatePixPayload(pixDataForPayload) : null;
    }, [errors, pixDataForPayload]);

    const warnings = useMemo((): TemplateWarning[] => {
        const warns: TemplateWarning[] = [];
        const combinedText =
            (template?.blocks || [])
                .flatMap(b => (b.type === 'text' ? [b.text] : []))
                .join(' ') +
            ' ' +
            Object.values(template?.assets || {})
                .map(a => (a as Asset).source)
                .join(' ');
        
        const placeholders = combinedText.match(/\{\{(\w+)\}\}/g) || [];
        for (const p of placeholders) {
            const key = p.replace(/\{|\}/g, '');
            if (!formData[key]) {
                warns.push({ type: 'placeholder', key });
            }
        }
        return warns;
    }, [template, formData]);
    
    const handleApplyPreset = useCallback((id: string) => {
      const preset = presets.find(p => p.id === id);
      if (preset) {
        setFormData(prev => ({ ...prev, ...preset.formValues }));
        alert(`Cadastro "${preset.label}" aplicado!`);
        setActiveTab('individual');
      }
    }, [presets, setFormData]);

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

                {activeTab === 'individual' && (
                    <IndividualTab 
                        formData={formData} 
                        setFormData={setFormData}
                        errors={errors} 
                        payload={payload}
                        template={template}
                        logo={logo}
                        warnings={warnings}
                        presets={presets}
                        onApplyPreset={handleApplyPreset}
                    />
                )}
                {activeTab === 'batch' && <BatchTab baseFormData={formData} template={template} logo={logo} presets={presets} />}
                {activeTab === 'admin' && <AdminTab />} 
                {activeTab === 'templates' && (
                    <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-6">
                        <TemplatesTab templates={allTemplates} selectedTemplate={template} onSelectTemplate={setTemplate} />
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
