import React, { useState } from 'react';
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
  presets: any[]; // Compatibilidade
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
}) => {
  const [resolvedProfile, setResolvedProfile] = useState<ResolvedPixProfile | null>(null);
  const [amount, setAmount] = useState('');

  const handleProfileResolved = (profile: ResolvedPixProfile | null) => {
    setResolvedProfile(profile);
    if (profile) {
      const newData = mapProfileToPixData(profile, amount);
      setFormData(newData);
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (resolvedProfile) {
      // Se temos um perfil ativo, regeneramos os dados para garantir consistência
      const newData = mapProfileToPixData(resolvedProfile, val);
      setFormData(newData);
    } else {
      // Fallback para edição manual
      const fieldSchema = template?.formSchema?.find(f => f.id === 'amount');
      const normalized = normalizeValue(val, fieldSchema);
      setFormData(prev => ({ ...prev, amount: normalized }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Gerar Cartão Individual</h2>
        <p className="text-sm text-muted-foreground mb-6">Selecione a igreja e a finalidade para carregar os dados.</p>
        
        {/* Novo Seletor Hierárquico */}
        <HierarchySelector onProfileResolved={handleProfileResolved} />
        
        {resolvedProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="md:col-span-2 border-b pb-4 mb-4">
                <h4 className="text-sm font-semibold text-primary mb-3">Campos Editáveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <TextField
                        label="Valor (opcional)"
                        placeholder="0,00"
                        value={formatValue(amount, { id: 'amount', type: 'currency', label: '' })}
                        onChange={e => handleAmountChange(e.target.value)}
                    />
                     <TextField
                        label="Mensagem (Opcional)"
                        value={formData.message || ''}
                        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        maxLength={72}
                    />
                </div>
            </div>

             <div className="md:col-span-2 space-y-3 opacity-80">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">Dados Carregados (Leitura)</h4>
                <div className="grid grid-cols-1 gap-3">
                    <TextField label="Recebedor" value={formData.name || ''} disabled />
                    <TextField label="Chave PIX (CNPJ)" value={formData.key || ''} disabled />
                    <TextField label="Cidade" value={formData.city || ''} disabled />
                    <TextField label="Identificador (TXID)" value={formData.txid || ''} disabled />
                    <TextField label="Dados Bancários" value={formData.bankDisplay || ''} disabled />
                </div>
             </div>
          </div>
        ) : (
           <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
               <p>Use os seletores acima para configurar os dados do PIX.</p>
           </div>
        )}
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