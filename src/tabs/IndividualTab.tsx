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

  // 1. Sincronização Inicial: Garante que o preview carregue ao abrir a aba
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
      // 2. Atualização Crítica: Notifica o App imediatamente ao carregar perfil
      onPreviewData(newData, template);
    } else {
       // Se limpar o perfil, limpamos o preview mas mantemos o form visualmente para não "piscar"
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
    
    // 3. Correção do Bug de Tempo Real:
    // Criamos o novo objeto ANTES de setar o estado para garantir consistência
    const newData = { ...formData, message: newMessage };
    
    setFormData(newData);
    onPreviewData(newData, template); // <--- O PULO DO GATO: Avisa o App que mudou!
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Coluna Formulário */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Gerar Cartão Individual</h2>
        <p className="text-sm text-muted-foreground mb-6">Selecione a hierarquia de dados (Regional, Igreja, Finalidade).</p>
        
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
                        onChange={(e) => handleAmountChange(e.target.value)}
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
                </div>
             </div>
          </div>
        ) : (
           <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
               <p>Use os seletores acima para configurar os dados do PIX.</p>
           </div>
        )}
      </div>

      {/* Coluna Preview Local (Restaurada) */}
      <div className="space-y-8 sticky top-24">
        <div className="border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50">
            <h3 className="text-sm font-bold mb-4 uppercase text-muted-foreground">Visualização do Cartão</h3>
            <CardPreview
                template={template}
                formData={formData}
                logo={logo}
                payload={payload}
                warnings={warnings}
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <QrPreview qrCodeValue={payload || undefined} txid={formData.txid} />
             <PayloadPreview payload={payload || undefined} txid={formData.txid} />
        </div>
      </div>
    </div>
  );
};

export default IndividualTab;