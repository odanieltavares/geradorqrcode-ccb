import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { produce } from 'immer';
import { PixData, Template } from '../types';
import { generatePixPayload, validatePixData } from '../lib/pix';
import { getPixDataFromForm } from '../utils/pixGenerator';
import { drawCardOnCanvas } from '../utils/cardGenerator';
import { Dropzone } from '../components/Dropzone';
import { Check, Download, Loader2, X } from 'lucide-react';
import HierarchySelector from '../components/HierarchySelector';
import { ResolvedPixProfile } from '../domain/types';
import { mapProfileToPixData } from '../utils/domainMapper';
import { normalizeValue } from '../utils/textUtils';

interface BatchTabProps {
  baseFormData: PixData;
  template: Template;
  logo: string | null;
  presets: any[]; // Mantido para compatibilidade, embora usemos o domínio agora
}

type BatchRow = {
  id: number;
  data: PixData;
  status: 'pending' | 'success' | 'error';
  error?: string;
  txid?: string;
};

const BatchTab: React.FC<BatchTabProps> = ({ template, logo }) => {
  // Estado do perfil fixo (hierarquia)
  const [resolvedProfile, setResolvedProfile] = useState<ResolvedPixProfile | null>(null);
  
  const [textInput, setTextInput] = useState('');
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Gera os dados base a partir da seleção hierárquica
  const baseData: PixData = useMemo(() => {
    if (resolvedProfile) {
      return mapProfileToPixData(resolvedProfile);
    }
    return {};
  }, [resolvedProfile]);

  const parseAndSetRows = (input: string) => {
    if (!resolvedProfile) {
        // Se não tiver perfil selecionado, não processa
        return; 
    }

    Papa.parse<string[]>(input, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        // Assume que a única coluna variável principal é o VALOR (amount)
        // Mas permite sobrescrever outros campos se o CSV tiver header? 
        // Para MVP simples: Coluna 1 = Valor, Coluna 2 (opcional) = Nome Recebedor alternativo
        
        const newRows: BatchRow[] = results.data.map((csvRowArray, index) => {
            const amount = csvRowArray[0] || '';
            const nameOverride = csvRowArray[1]; // Opcional

            // Normaliza o valor
            const amountField = template?.formSchema?.find(f => f.id === 'amount');
            const normalizedAmount = normalizeValue(amount, amountField);

            // Mescla os dados do perfil base com os dados do CSV
            const rowData: PixData = {
                ...baseData,
                amount: normalizedAmount,
                displayValue: normalizedAmount ? `R$ ${normalizedAmount}` : 'R$ ***,00',
            };

            if (nameOverride) {
                rowData.name = nameOverride;
            }

            // Gera um TXID único para o lote se necessário, ou usa o do perfil
            // Aqui mantemos o TXID do perfil, mas poderíamos adicionar sufixo de lote
            // rowData.txid = ...

            return { id: index, data: rowData, status: 'pending' };
        });
        setRows(newRows);
      }
    });
  };

  const handleFileDrop = (files: File[]) => {
    if (files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setTextInput(text);
        if(resolvedProfile) parseAndSetRows(text);
      };
      reader.readAsText(files[0]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextInput(val);
    if(resolvedProfile) parseAndSetRows(val);
  };

  const startBatchProcess = async () => {
    if (!rows.length) return;
    setIsProcessing(true);
    setProgress(0);
    const zip = new JSZip();
    const report: any[] = [];
    
    // Setup canvas invisível
    const canvas = document.createElement('canvas');
    canvas.width = template.canvas.width;
    canvas.height = template.canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Carrega fontes antes do loop
    // (Simplificação: assume que cardGenerator carrega, mas idealmente carregaria aqui uma vez)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const finalData = row.data;
      const pixDataForPayload = getPixDataFromForm(template, finalData);
      const errors = validatePixData(pixDataForPayload);

      if (Object.keys(errors).length > 0) {
        const errorString = Object.values(errors).join(' ');
        setRows(produce(draft => { draft[i].status = 'error'; draft[i].error = errorString; }));
        report.push({ linha: i + 1, status: 'erro', txid: pixDataForPayload.txid, erro: errorString });
        continue;
      }

      try {
        const payload = generatePixPayload(pixDataForPayload);
        const qrCodeDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'H', margin: 2, scale: 8 });
        
        await drawCardOnCanvas(ctx, template, finalData, logo, qrCodeDataUrl);
        
        const pngBlob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'));
        
        if (pngBlob) {
            // Nome do arquivo único
          const fileName = `card_${pixDataForPayload.txid}_${i+1}.png`;
          zip.file(fileName, pngBlob);
          
          setRows(produce(draft => { draft[i].status = 'success'; draft[i].txid = pixDataForPayload.txid; }));
          report.push({ linha: i + 1, status: 'sucesso', arquivo: fileName, valor: finalData.amount });
        }

      } catch (err: any) {
        setRows(produce(draft => { draft[i].status = 'error'; draft[i].error = err.message; }));
      }
      setProgress(((i + 1) / rows.length) * 100);
    }

    const reportCsv = Papa.unparse(report);
    zip.file('relatorio.csv', reportCsv);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lote_pix_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    
    setIsProcessing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border shadow-sm space-y-6">
        <div>
            <h2 className="text-lg font-semibold">Gerar em Lote</h2>
            <p className="text-sm text-muted-foreground">1. Configure os dados fixos (Igreja/Finalidade). <br/>2. Cole a lista de valores.</p>
        </div>
        
        {/* 1. Seletor Hierárquico para dados base */}
        <div className="border p-4 rounded-md bg-secondary/20">
            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground">Dados Base</h3>
            <HierarchySelector onProfileResolved={setResolvedProfile} />
            {!resolvedProfile && <p className="text-xs text-destructive mt-2">Selecione todos os campos acima para habilitar a entrada de dados.</p>}
        </div>

        {/* 2. Área de entrada de CSV */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Lista de Valores (CSV)</label>
             <p className="text-xs text-muted-foreground mb-2">
                Formato simples: <code>VALOR</code> (ex: <code>10,00</code>)<br/>
                Ou: <code>VALOR, NOME_ALTERNATIVO</code>
            </p>
            <textarea
                value={textInput}
                onChange={handleTextChange}
                disabled={!resolvedProfile}
                placeholder={resolvedProfile ? "Ex:\n10,00\n20,50\n50,00, Irmão Exemplo" : "Configure os dados base primeiro..."}
                className="w-full h-32 min-h-[128px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono disabled:opacity-50"
            />
        </div>
        
         <div className="space-y-2">
            <label className="text-sm font-medium">Ou Enviar Arquivo CSV</label>
            <Dropzone 
                onDrop={handleFileDrop} 
                accept={{ 'text/csv': ['.csv'] }}
                label="Clique ou arraste um arquivo CSV aqui"
                description="O conteúdo será colado na área de texto."
            />
        </div>
      </div>
      
      <div className="space-y-8 sticky top-24">
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Processamento</h3>
            
            <div className="mb-4 text-sm">
                <p><strong>Perfil:</strong> {resolvedProfile ? `${resolvedProfile.congregation.shortPrefix} - ${resolvedProfile.pixPurpose.displayLabel}` : '-'}</p>
                <p><strong>Itens detectados:</strong> {rows.length}</p>
            </div>

            {rows.length > 0 ? (
            <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                {rows.map(row => (
                    <div key={row.id} className="text-xs p-2 border rounded-md flex justify-between items-center">
                    <span className="font-mono truncate">Item {row.id + 1}: {row.data.amount} {row.data.name !== baseData.name ? `(${row.data.name})` : ''}</span>
                    {row.status === 'success' && <Check className="w-4 h-4 text-green-500" />}
                    {row.status === 'error' && <X className="w-4 h-4 text-destructive" title={row.error} />}
                    </div>
                ))}
                </div>
                <button
                onClick={startBatchProcess}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
                >
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {Math.round(progress)}%</> : `Gerar ${rows.length} Cartões`}
                </button>
            </div>
            ) : (
            <div className="text-center text-sm text-muted-foreground py-10">
                Aguardando dados...
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BatchTab;