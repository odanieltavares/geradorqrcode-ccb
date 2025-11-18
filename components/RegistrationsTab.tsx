import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';
import { Preset, PixData, Template } from '../types';
import { Plus, Download, Upload, Edit, Trash2, Send } from 'lucide-react';
import TextField from './TextField';
import { normalizeValue, formatValue } from '../utils/textUtils';

interface RegistrationsTabProps {
  presets: Preset[];
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>;
  onApplyPreset: (preset: Preset) => void;
  template: Template;
}

const PresetForm: React.FC<{
    currentPreset: Preset | null;
    onSave: (preset: Preset) => void;
    onClose: () => void;
    template: Template;
}> = ({ currentPreset, onSave, onClose, template }) => {
    const [label, setLabel] = useState(currentPreset?.label || '');
    const [formValues, setFormValues] = useState<PixData>(currentPreset?.formValues || {});

    const handleChange = (id: keyof PixData, value: string) => {
        const fieldSchema = template?.formSchema?.find(f => f.id === id);
        const normalized = normalizeValue(value, fieldSchema);
        setFormValues(prev => ({ ...prev, [id]: normalized }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!label.trim()) {
            alert('O campo "Rótulo" é obrigatório.');
            return;
        }
        onSave({
            id: currentPreset?.id || uuidv4(),
            label,
            formValues,
            updatedAt: new Date().toISOString(),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card p-6 rounded-lg border shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">{currentPreset?.id ? 'Editar' : 'Novo'} Cadastro</h3>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto space-y-4 pr-2">
                    <TextField
                        id="preset-label"
                        label="Rótulo / Nome do Cadastro"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        placeholder="Ex: Coleta Geral São Paulo"
                        required
                    />
                    <div className="border-t pt-4 mt-4">
                         <h4 className="text-md font-semibold text-muted-foreground mb-4">Dados do PIX</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {template?.formSchema?.map(field => (
                                <TextField
                                    key={field.id}
                                    id={field.id as string}
                                    label={field.label}
                                    description={field.description}
                                    placeholder={field.placeholder}
                                    maxLength={field.maxLength}
                                    value={formatValue(formValues[field.id as string] || '', field)}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                />
                            ))}
                        </div>
                    </div>
                </form>
                <div className="flex justify-end gap-4 pt-6 border-t mt-6">
                    <button type="button" onClick={onClose} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md text-sm">Cancelar</button>
                    <button type="button" onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const RegistrationsTab: React.FC<RegistrationsTabProps> = ({ presets, setPresets, onApplyPreset, template }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  const handleSave = (preset: Preset) => {
    setPresets(produce(draft => {
        const index = draft.findIndex(p => p.id === preset.id);
        if (index > -1) {
            draft[index] = preset;
        } else {
            draft.push(preset);
        }
    }));
    setIsFormOpen(false);
    setEditingPreset(null);
  };
  
  const handleDelete = (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir este cadastro?')) {
        setPresets(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(presets, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "pix_cadastros.json";
    link.click();
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedPresets = JSON.parse(e.target?.result as string);
          if(Array.isArray(importedPresets)) {
            // Basic validation
            const isValid = importedPresets.every(p => p.id && p.label && p.formValues);
            if(isValid) {
                 setPresets(importedPresets);
                 alert(`${importedPresets.length} cadastros importados com sucesso.`);
            } else {
                alert('O arquivo JSON parece ser inválido ou não segue o formato esperado.');
            }
          }
        } catch (err) {
            alert('Erro ao ler o arquivo JSON.');
        }
      };
      reader.readAsText(file);
    }
  };


  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        {isFormOpen && <PresetForm template={template} currentPreset={editingPreset} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditingPreset(null); }} />}
      <div className="flex justify-between items-center mb-4">
        <div>
            <h2 className="text-lg font-semibold">Cadastros</h2>
            <p className="text-sm text-muted-foreground">Gerencie perfis de dados PIX reutilizáveis.</p>
        </div>
        <div className="flex gap-2">
            <input type="file" id="import-json" className="hidden" accept=".json" onChange={handleImport} />
            <button onClick={() => document.getElementById('import-json')?.click()} className="h-10 px-4 py-2 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2"><Upload size={16}/> Importar</button>
            <button onClick={handleExport} className="h-10 px-4 py-2 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2"><Download size={16}/> Exportar</button>
            <button onClick={() => { setEditingPreset(null); setIsFormOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm inline-flex items-center gap-2"><Plus size={16}/> Novo</button>
        </div>
      </div>

      <div className="border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="p-3 text-left font-medium">Rótulo</th>
              <th className="p-3 text-left font-medium hidden md:table-cell">Atualizado em</th>
              <th className="p-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {presets.length === 0 ? (
                <tr><td colSpan={3} className="text-center p-8 text-muted-foreground">Nenhum cadastro encontrado.</td></tr>
            ) : (
                presets.sort((a, b) => a.label.localeCompare(b.label)).map(preset => (
                  <tr key={preset.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{preset.label}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{new Date(preset.updatedAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                       <div className="flex gap-2 justify-end">
                           <button onClick={() => onApplyPreset(preset)} title="Usar no Individual" className="p-2 hover:bg-secondary rounded-md"><Send size={16}/></button>
                           <button onClick={() => { setEditingPreset(preset); setIsFormOpen(true); }} title="Editar" className="p-2 hover:bg-secondary rounded-md"><Edit size={16}/></button>
                           <button onClick={() => handleDelete(preset.id)} title="Excluir" className="p-2 hover:bg-secondary rounded-md text-destructive"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegistrationsTab;