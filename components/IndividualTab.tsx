

import React from 'react';
import CardPreview from './CardPreview';
import QrPreview from './QrPreview';
import PayloadPreview from './PayloadPreview';
import { PixData, FormErrors, Template, TemplateWarning, Preset } from '../types';
import TextField from './TextField';
import { normalizeValue, formatValue } from '../utils/textUtils';

interface IndividualTabProps {
  formData: PixData;
  setFormData: React.Dispatch<React.SetStateAction<PixData>>;
  errors: FormErrors;
  payload: string | null;
  template: Template;
  logo: string | null;
  warnings: TemplateWarning[];
  presets: Preset[];
  onApplyPreset: (id: string) => void;
}

const IndividualTab: React.FC<IndividualTabProps> = ({
  formData,
  setFormData,
  errors,
  payload,
  template,
  logo,
  warnings,
  presets,
  onApplyPreset,
}) => {
  const handleChange = (id: keyof PixData, value: string) => {
    const fieldSchema = template?.formSchema?.find(f => f.id === id);
    const normalized = normalizeValue(value, fieldSchema);

    setFormData(prev => {
        const newState: PixData = { ...prev, [id]: normalized };
        
        // Sincronização inteligente: Se o campo 'city' (payload) for alterado,
        // atualiza também o campo 'location' (cidade no cartão), mas apenas se
        // o usuário não o tiver alterado manualmente para um valor diferente.
        if (id === 'city' && (prev.location === prev.city || !prev.location)) {
            newState.location = normalized;
        }
        
        return newState;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <div>
                 <h2 className="text-lg font-semibold">Gerar Individual</h2>
                 <p className="text-sm text-muted-foreground">Preencha os dados para gerar o cartão.</p>
            </div>
            {presets.length > 0 && (
                 <select 
                    onChange={(e) => e.target.value && onApplyPreset(e.target.value)}
                    value=""
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <option value="">Usar um cadastro...</option>
                    {presets.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                </select>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {template?.formSchema?.map(field => (
            <TextField
              key={field.id}
              id={field.id as string}
              label={field.label}
              description={field.description}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              value={formatValue(formData[field.id as string] || '', field)}
              onChange={(e) => handleChange(field.id, e.target.value)}
              error={errors[field.id as string]}
            />
          ))}
        </div>
      </div>

      <div className="space-y-8 sticky top-24">
        <CardPreview
          template={template}
          formData={formData}
          logo={logo}
          payload={payload}
          warnings={warnings}
        />
        <QrPreview qrCodeValue={payload || undefined} txid={formData.txid} />
        <PayloadPreview payload={payload || undefined} txid={formData.txid} />
      </div>
    </div>
  );
};

export default IndividualTab;