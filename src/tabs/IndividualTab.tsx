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
  // Nova prop para notificar o App sobre a atualização da PixData, corrigindo o bug de preview.
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

  const handleProfileResolved = (profile: ResolvedPixProfile | null) => {
    setResolvedProfile(profile);
    
    if (profile) {
      const newData = mapProfileToPixData(profile, amount);
      setFormData(newData);
      // BUG FIX: Notifica o App para que o Card/QR Preview seja gerado com os novos dados
      onPreviewData(newData, template);
    } else {
      setFormData({} as PixData);
      onPreviewData(null, template);
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    
    const fieldSchema = template?.formSchema?.find(f => f.id === 'amount');
    const normalized = normalizeValue(val, fieldSchema);

    if (resolvedProfile) {
      // Se há um perfil, regenera os dados para manter a consistência do domínio
      const newData = mapProfileToPixData(resolvedProfile, normalized);
      setFormData(newData);
      onPreviewData(newData, template); // Notifica o App
    } else {
      // Fallback para edição manual do valor se não houver perfil selecionado
      setFormData(prev => ({ ...prev, amount: normalized }));
      // O App já fará o re-render com o formData atualizado
    }
  };
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setFormData(prev => ({ ...prev, message: newMessage }));
    // A alteração de message é simples e o App irá re-renderizar a partir do setFormData
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Gerar Cartão Individual</h2>
        <p className="text-sm text-muted-foreground mb-6">Selecione a hierarquia de dados (Regional, Igreja, Finalidade).</p>
        
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
                        onChange={handleAmountChange}
                    />
                     <TextField
                        label="Mensagem (Opcional)"
                        value={formData.message || ''}
                        onChange={handleMessageChange}
                        maxLength={72}
                    />
                </div>
            </div>

             <div className="md:col-span-2 space-y-3 opacity-80">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">Dados Carregados (Leitura)</h4>
                <div className="grid grid-cols-1 gap-3">
                    <TextField label="Recebedor" value={formData.name || ''} disabled />
                    <TextField label="Chave PIX (CNPJ)" value={formData.key || ''} disabled />
                    <TextField label="Cidade (Payload)" value={formData.city || ''} disabled />
                    <TextField label="Identificador (TXID)" value={formData.txid || ''} disabled />
                    <TextField label="Dados Bancários" value={formData.bankDisplay || ''} disabled />
                    <TextField label="Cód. Igreja" value={formData.congregationCode || ''} disabled />
                    <TextField label="Finalidade" value={formData.purposeLabel || ''} disabled />
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