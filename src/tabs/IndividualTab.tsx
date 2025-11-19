import React, { useState, useEffect } from 'react';
import CardPreview from '../components/CardPreview'; 
import QrPreview from '../components/QrPreview';
import PayloadPreview from '../components/PayloadPreview';
import { PixData, FormErrors, Template, TemplateWarning } from '../types';
import TextField from '../components/TextField';
import HierarchySelector from '../components/HierarchySelector';
import { ResolvedPixProfile } from '../domain/types';
import { mapProfileToPixData } from '../utils/domainMapper';
import { formatValue, normalizeValue } from '../utils/textUtils';

interface IndividualTabProps {
  formData: PixData;
  setFormData: React.Dispatch<React.SetStateAction<PixData>>;
  errors: FormErrors;
  payload: string | null;
  template: Template;
  logo: string | null;
  warnings: TemplateWarning[];
  onPreviewData: (data: PixData | null, template: Template) => void; 
}

const IndividualTab: React.FC<IndividualTabProps> = ({
  formData,
  setFormData,
  errors,
  payload,
  template,
  logo,
  warnings,
  onPreviewData,
}) => {
  const [resolvedProfile, setResolvedProfile] = useState<ResolvedPixProfile | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
       onPreviewData(formData, template);
    }
  }, []);

  const handleProfileResolved = (profile: ResolvedPixProfile | null) => {
    setResolvedProfile(profile);
    
    if (profile) {
      const newData = mapProfileToPixData(profile, amount);
      setFormData(newData);
      onPreviewData(newData, template);
    } else {
       onPreviewData(null, template);
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const fieldSchema = template?.formSchema?.find(f => f.id === 'amount');
    const normalized = normalizeValue(val, fieldSchema);

    let newData: PixData;
    if (resolvedProfile) {
      newData = mapProfileToPixData(resolvedProfile, normalized);
    } else {
      newData = { ...formData, amount: normalized };
    }
    setFormData(newData);
    onPreviewData(newData, template);
  };
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    const newData = { ...formData, message: newMessage };
    setFormData(newData);
    onPreviewData(newData, template);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Formulário */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Cartão Individual</h2>
        <p className="text-sm text-muted-foreground mb-6">Configure os dados abaixo.</p>
        
        <HierarchySelector onProfileResolved={handleProfileResolved} />
        
        {resolvedProfile ? (
          <div className="grid grid-cols-1 gap-4 mt-6 animate-in fade-in">
             <div className="p-4 border rounded-lg bg-primary/5">
                <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">Campos Editáveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <TextField
                        label="Valor (R$)"
                        placeholder="0,00"
                        value={formatValue(amount, { id: 'amount', type: 'currency', label: '' })}
                        onChange={(e) => handleAmountChange(e.target.value)}
                    />
                     <TextField
                        label="Mensagem Personalizada"
                        value={formData.message || ''}
                        onChange={handleMessageChange}
                        maxLength={72}
                    />
                </div>
            </div>

             <div className="space-y-3 opacity-80">
                <h4 className="text-xs font-bold uppercase text-muted-foreground mt-2">Dados do Perfil (Leitura)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                        <TextField label="Recebedor (Titular)" value={formData.name || ''} disabled />
                    </div>
                    <TextField label="Chave PIX" value={formData.key || ''} disabled />
                    <TextField label="Cidade" value={formData.city || ''} disabled />
                    <TextField label="TXID (Identificador)" value={formData.txid || ''} disabled />
                    <TextField label="Cód. Igreja" value={formData.congregationCode || ''} disabled />
                    <div className="md:col-span-2">
                         <TextField label="Finalidade (Padrão)" value={formData.purposeLabel || ''} disabled />
                    </div>
                </div>
             </div>
          </div>
        ) : (
           <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg mt-4">
               <p>Selecione a hierarquia acima para começar.</p>
           </div>
        )}
      </div>

      {/* Preview */}
      <div className="space-y-8 sticky top-24">
        <CardPreview
            template={template}
            formData={formData}
            logo={logo}
            payload={payload}
            warnings={warnings}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <QrPreview qrCodeValue={payload || undefined} txid={formData.txid} />
             <PayloadPreview payload={payload || undefined} txid={formData.txid} />
        </div>
      </div>
    </div>
  );
};

export default IndividualTab;