import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { produce } from 'immer';
import { PixData, Template, ResolvedPixProfile, TemplateWarning } from '../types';
import { generatePixPayload, validatePixData } from '../lib/pix';
import { getPixDataFromForm } from '../utils/pixGenerator';
import { drawCardOnCanvas } from '../utils/cardGenerator';
import { Dropzone } from '../components/Dropzone';
import { Check, Download, Loader2, X, Eye } from 'lucide-react';
import HierarchySelector from '../components/HierarchySelector';
import { useDomain } from '../context/DomainContext';
import { mapProfileToPixData, resolveProfile } from '../utils/domainMapper';
import { normalizeValue } from '../utils/textUtils';
import TextField from '../components/TextField';
import { v4 as uuidv4 } from 'uuid';
import CardPreview from '../components/CardPreview';
import QrPreview from '../components/QrPreview';
import PayloadPreview from '../components/PayloadPreview';

interface BatchTabProps {
  template: Template;
  logo: string | null;
  onPreviewData: (data: PixData | null, template: Template) => void;
  payload: string | null;
  warnings: TemplateWarning[];
  previewData: PixData | null;
}

type BatchRow = {
  id: string;
  data: PixData;
  status: 'pending' | 'success' | 'error';
  error?: string;
  txid?: string;
};

const BatchTab: React.FC<BatchTabProps> = ({ template, logo, onPreviewData, payload, warnings, previewData }) => {
  const domain = useDomain();
  
  const [mode, setMode] = useState<'csv' | 'series'>('series');
  const [resolvedProfile, setResolvedProfile] = useState<ResolvedPixProfile | null>(null);
  const [textInput, setTextInput] = useState('');
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Estados para o modo "Série de Igrejas"
  const [selectedRegionalId, setSelectedRegionalId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedCongregations, setSelectedCongregations] = useState<string[]>([]);
  const [selectedPurposeId, setSelectedPurposeId] = useState('');


  // Base data for CSV mode
  const baseData: PixData = useMemo(() => {
    if (resolvedProfile) {
      return mapProfileToPixData(resolvedProfile);
    }
    return {} as PixData;
  }, [resolvedProfile]);

  // FIX: Mostra o preview do primeiro item da fila (ou do perfil base)
  useEffect(() => {
    if (rows.length > 0) {
        onPreviewData(rows[0].data, template);
    } else if (resolvedProfile) {
        onPreviewData(baseData, template);
    } else {
        onPreviewData(null, template);
    }
  }, [rows, resolvedProfile, template, onPreviewData, baseData]);


  // --- Lógica de Modos ---

  // Modo CSV
  const parseAndSetRows = (input: string) => {
    if (!resolvedProfile) return; 

    Papa.parse<string[]>(input, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const newRows: BatchRow[] = results.data.map((csvRowArray, index) => {
            const amount = csvRowArray[0] || '';
            const messageOverride = csvRowArray[1]; 

            const amountField = template?.formSchema?.find(f => f.id === 'amount');
            const normalizedAmount = normalizeValue(amount, amountField);

            const rowData: PixData = {
                ...baseData,
                amount: normalizedAmount,
                displayValue: normalizedAmount ? `R$ ${normalizedAmount}` : baseData.displayValue,
            };

            if (messageOverride) {
                rowData.message = messageOverride;
            }

            return { id: uuidv4(), data: rowData, status: 'pending' };
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


  // Modo Série (Gera as linhas a partir das Igrejas Selecionadas)
  useEffect(() => {
    if (mode === 'series' && selectedCongregations.length > 0 && selectedPurposeId) {
        const newRows: BatchRow[] = selectedCongregations.map(congId => {
            const cong = domain.congregations.find(c => c.id === congId)!;
            const regional = domain.regionals.find(r => r.id === cong.regionalId)!;
            const city = domain.cities.find(c => c.id === cong.cityId)!;
            
            // Resolve o perfil completo para a Congregação
            const profile = resolveProfile(regional.stateId, regional.id, city.id, congId, selectedPurposeId, domain);
            
            if (!profile) return null;

            const rowData = mapProfileToPixData(profile);
            
            return { 
                id: uuidv4(), 
                data: rowData, 
                status: 'pending',
            };
        }).filter((r): r is BatchRow => r !== null);
        
        setRows(newRows);
    } else if (mode === 'series') {
        setRows([]);
    }
  }, [selectedCongregations, selectedPurposeId, domain, mode]);


  // --- Lógica de Processamento ---
  const startBatchProcess = async () => {
    if (!rows.length) return;
    setIsProcessing(true);
    setProgress(0);
    const zip = new JSZip();
    
    // Setup canvas invisível (necessário para o drawCardOnCanvas)
    const canvas = document.createElement('canvas');
    canvas.width = template.canvas.width;
    canvas.height = template.canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;


    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const finalData = row.data;
      const pixDataForPayload = getPixDataFromForm(template, finalData);
      const errors = validatePixData(pixDataForPayload);

      if (Object.keys(errors).length > 0) {
        const errorString = Object.values(errors).join(' ');
        setRows(produce(draft => { draft[i].status = 'error'; draft[i].error = errorString; }));
        continue;
      }

      try {
        const payload = generatePixPayload(pixDataForPayload);
        const qrCodeDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'H', margin: 2, scale: 8 });
        
        // Simulação do processamento (Remover em produção)
        await new Promise(resolve => setTimeout(resolve, 50)); 
        
        // Gera o cartão
        await drawCardOnCanvas(ctx, template, finalData, logo, qrCodeDataUrl);
        
        const pngBlob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'));
        
        if (pngBlob) {
            // Nome do arquivo único
          const fileName = `card_${pixDataForPayload.txid}_${i+1}.png`;
          zip.file(fileName, pngBlob);
          
          setRows(produce(draft => { draft[i].status = 'success'; draft[i].txid = pixDataForPayload.txid; }));
        }

      } catch (err: any) {
        setRows(produce(draft => { draft[i].status = 'error'; draft[i].error = err.message || "Erro desconhecido"; }));
      }
      setProgress(((i + 1) / rows.length) * 100);
    }

    // Geração do ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lote_pix_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    
    setIsProcessing(false);
  };

  // Componente de seleção em série (checkboxes)
  const renderSeriesSelector = () => {
    const congregationsInCity = domain.congregations.filter(c => c.cityId === selectedCityId);

    const handleToggleCongregation = (id: string) => {
        setSelectedCongregations(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleUpdateMessage = (rowId: string, newMessage: string) => {
        setRows(produce(draft => {
            const index = draft.findIndex(r => r.id === rowId);
            if (index !== -1) {
                draft[index].data.message = newMessage;
                draft[index].data.purposeLabel = newMessage;
            }
        }));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium mb-1">Regional</label>
                    <select value={selectedRegionalId} onChange={e => { setSelectedRegionalId(e.target.value); setSelectedCityId(''); setSelectedCongregations([]); }} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Selecione a Regional...</option>
                        {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Cidade</label>
                    <select value={selectedCityId} onChange={e => { setSelectedCityId(e.target.value); setSelectedCongregations([]); }} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" disabled={!selectedRegionalId}>
                        <option value="">Selecione a Cidade...</option>
                        {domain.cities.filter(c => c.regionalId === selectedRegionalId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Finalidade */}
             <div>
                <label className="block text-xs font-medium mb-1">Finalidade Base</label>
                <select value={selectedPurposeId} onChange={e => setSelectedPurposeId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" disabled={!selectedCityId}>
                    <option value="">Selecione a Finalidade...</option>
                    {domain.purposes.map(p => <option key={p.id} value={p.id}>{p.displayLabel}</option>)}
                </select>
            </div>


            {selectedCityId && (
                <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2">
                    <p className="text-sm font-semibold">Igrejas em {domain.cities.find(c => c.id === selectedCityId)?.name}:</p>
                    {congregationsInCity.map(cong => (
                        <div key={cong.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={selectedCongregations.includes(cong.id)}
                                    onChange={() => handleToggleCongregation(cong.id)}
                                    disabled={!selectedPurposeId}
                                />
                                {cong.name} ({cong.shortPrefix}{cong.ccbSuffix})
                            </label>
                        </div>
                    ))}
                </div>
            )}
            
            {rows.length > 0 && (
                <div className="border rounded p-3 space-y-3">
                    <p className="font-semibold text-primary">Edição em Série ({rows.length} itens)</p>
                    {rows.map(row => (
                        <div key={row.id} className="flex items-center gap-2">
                            <button 
                                onClick={() => onPreviewData(row.data, template)}
                                className="p-1 rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                title="Visualizar este item"
                            >
                                <Eye size={18} />
                            </button>
                            <span className="text-sm w-40 truncate">{row.data.neighborhood}</span>
                            <TextField
                                label=""
                                placeholder="Mensagem / Finalidade"
                                value={row.data.message}
                                onChange={e => handleUpdateMessage(row.id, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex items-center gap-2 mt-4">
                <button onClick={startBatchProcess} disabled={isProcessing || rows.length === 0} className="bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50 flex items-center gap-2">
                    {isProcessing ? <Loader2 className="animate-spin"/> : <Download size={18}/>}
                    {isProcessing ? 'Processando...' : 'Gerar Lote'}
                </button>
                {isProcessing && <div className="text-xs text-muted-foreground">{Math.round(progress)}%</div>}
            </div>

        </div>
    );
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border shadow-sm space-y-6">
        <div>
            <h2 className="text-lg font-semibold">Gerar em Lote</h2>
            <p className="text-sm text-muted-foreground">Escolha um modo de entrada de dados.</p>
        </div>
        
        {/* Modos */}
        <div className="flex gap-4 border-b pb-4">
            <button 
                onClick={() => { setMode('series'); setResolvedProfile(null); setRows([]); setTextInput(''); }} 
                className={`px-4 py-2 text-sm font-medium rounded ${mode === 'series' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
            >
                Seleção em Série (Igrejas)
            </button>
            <button 
                onClick={() => { setMode('csv'); setResolvedProfile(null); setRows([]); setTextInput(''); }} 
                className={`px-4 py-2 text-sm font-medium rounded ${mode === 'csv' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
            >
                CSV / Valor Variável
            </button>
        </div>

        {/* MODO CSV */}
        {mode === 'csv' && (
            <div className="space-y-4">
                <div className="border p-4 rounded-md bg-secondary/20">
                    <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground">Dados Base (Fixo)</h3>
                    <HierarchySelector onProfileResolved={setResolvedProfile} />
                    {!resolvedProfile && <p className="text-xs text-destructive mt-2">Selecione todos os campos acima.</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Lista de Valores e Mensagens (CSV)</label>
                    <p className="text-xs text-muted-foreground mb-2">
                        Formato: <code>VALOR</code> ou <code>VALOR, MENSAGEM_ALTERNATIVO</code>
                    </p>
                    <textarea
                        value={textInput}
                        onChange={handleTextChange}
                        disabled={!resolvedProfile}
                        placeholder={resolvedProfile ? "Ex:\n10,00\n20,50, OFERTA MISSAO\n50,00" : "Configure os dados base primeiro..."}
                        className="w-full h-32 min-h-[128px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono disabled:opacity-50"
                    />
                </div>
                <Dropzone onDrop={handleFileDrop} accept={{ 'text/csv': ['.csv'] }} label="Ou Enviar Arquivo CSV" description="O conteúdo será colado na área de texto."/>
                
                 <div className="flex items-center gap-2 mt-4">
                    <button onClick={startBatchProcess} disabled={isProcessing || rows.length === 0} className="bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50 flex items-center gap-2">
                        {isProcessing ? <Loader2 className="animate-spin"/> : <Download size={18}/>}
                        {isProcessing ? 'Processando...' : 'Gerar Lote'}
                    </button>
                </div>
            </div>
        )}
        
        {/* MODO SÉRIE */}
        {mode === 'series' && renderSeriesSelector()}
      </div>
      
      {/* Coluna de Previews (Sidebar) */}
      <div className="space-y-8 sticky top-24">
        <CardPreview
          template={template}
          formData={previewData || {} as PixData}
          logo={logo}
          payload={payload}
          warnings={warnings}
        />
        <QrPreview qrCodeValue={payload || undefined} txid={previewData?.txid} />
        <PayloadPreview payload={payload || undefined} txid={previewData?.txid} />
      </div>
    </div>
  );
};

export default BatchTab;