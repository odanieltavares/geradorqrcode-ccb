import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { produce } from 'immer';
import { PixData, Template, ResolvedPixProfile } from '../types';
import { generatePixPayload, validatePixData } from '../lib/pix';
import { getPixDataFromForm } from '../utils/pixGenerator';
import { drawCardOnCanvas } from '../utils/cardGenerator';
import { Dropzone } from '../components/Dropzone';
import { Check, Download, Loader2, X, Eye, Trash2, Settings } from 'lucide-react';
import HierarchySelector from '../components/HierarchySelector';
import { useDomain } from '../context/DomainContext';
import { mapProfileToPixData, resolveProfile } from '../utils/domainMapper';
import { normalizeValue } from '../utils/textUtils';
import TextField from '../components/TextField';
import { v4 as uuidv4 } from 'uuid';
import CardPreview from '../components/CardPreview';

interface BatchTabProps {
  template: Template;
  logo: string | null;
  onPreviewData: (data: PixData | null, template: Template) => void;
}

type BatchRow = {
  id: string;
  data: PixData;
  status: 'pending' | 'success' | 'error';
  error?: string;
  txid?: string;
};

const BatchTab: React.FC<BatchTabProps> = ({ template, logo, onPreviewData }) => {
  const domain = useDomain();
  
  // CONFIGURAÇÃO 1: Modo padrão 'series'
  const [mode, setMode] = useState<'csv' | 'series'>('series');
  const [resolvedProfile, setResolvedProfile] = useState<ResolvedPixProfile | null>(null);
  const [textInput, setTextInput] = useState('');
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Estado local para controlar qual item está sendo mostrado no Preview Lateral
  const [activePreviewData, setActivePreviewData] = useState<PixData | null>(null);

  // Estados para o modo "Série de Igrejas"
  const [selectedRegionalId, setSelectedRegionalId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedCongregations, setSelectedCongregations] = useState<string[]>([]);
  const [selectedPurposeId, setSelectedPurposeId] = useState('');

  // NOVOS ESTADOS: Opções de Exportação
  const [exportCards, setExportCards] = useState(true);
  const [exportQrCodes, setExportQrCodes] = useState(false);
  const [exportPayloads, setExportPayloads] = useState(false);

  // 1. Dados Base (Perfil Selecionado)
  const baseData: PixData = useMemo(() => {
    if (resolvedProfile) {
      return mapProfileToPixData(resolvedProfile);
    }
    return {} as PixData;
  }, [resolvedProfile]);

  // 2. Sincronização do Preview
  useEffect(() => {
    // Lógica de Prioridade: Item Selecionado > Primeiro da Lista > Dados Base
    let dataToShow: PixData | null = null;

    if (activePreviewData) {
        dataToShow = activePreviewData;
    } else if (rows.length > 0) {
        dataToShow = rows[0].data;
    } else if (resolvedProfile) {
        dataToShow = baseData;
    }

    if (!activePreviewData && dataToShow) {
        setActivePreviewData(dataToShow);
    }

    // Notifica o App (consistência global)
    onPreviewData(dataToShow, template);

  }, [rows, resolvedProfile, baseData, template, onPreviewData, activePreviewData]);


  // --- Lógica de Modos ---

  // Modo CSV: Parse
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
        if (newRows.length > 0) setActivePreviewData(newRows[0].data);
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

  // Modo Série: Geração Automática
  useEffect(() => {
    if (mode === 'series' && selectedCongregations.length > 0 && selectedPurposeId) {
        const newRows: BatchRow[] = selectedCongregations.map(congId => {
            const cong = domain.congregations.find(c => c.id === congId)!;
            const regional = domain.regionals.find(r => r.id === cong.regionalId)!;
            const city = domain.cities.find(c => c.id === cong.cityId)!;
            
            const profile = resolveProfile(regional.stateId, regional.id, city.id, congId, selectedPurposeId, domain);
            
            if (!profile) return null;
            const rowData = mapProfileToPixData(profile);
            
            return { id: uuidv4(), data: rowData, status: 'pending' };
        }).filter((r): r is BatchRow => r !== null);
        
        setRows(newRows);
        
        if (newRows.length > 0) {
            setActivePreviewData(newRows[0].data);
        } else {
            setActivePreviewData(null);
        }

    } else if (mode === 'series') {
        setRows([]);
        setActivePreviewData(null);
    }
  }, [selectedCongregations, selectedPurposeId, domain, mode]);


  // --- Processamento ---
  const startBatchProcess = async () => {
    if (!rows.length) return;
    if (!exportCards && !exportQrCodes && !exportPayloads) {
        alert("Selecione pelo menos uma opção de exportação (Cartões, QR Code ou Payload).");
        return;
    }

    setIsProcessing(true);
    setProgress(0);
    const zip = new JSZip();
    
    const canvas = document.createElement('canvas');
    canvas.width = template.canvas.width;
    canvas.height = template.canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const finalData = row.data;
      
      setActivePreviewData(finalData); 

      const pixDataForPayload = getPixDataFromForm(template, finalData);
      const errors = validatePixData(pixDataForPayload);

      if (Object.keys(errors).length > 0) {
        const errorString = Object.values(errors).join(' ');
        setRows(produce(draft => { draft[i].status = 'error'; draft[i].error = errorString; }));
        continue;
      }

      try {
        // 1. Gera Payload String
        const payload = generatePixPayload(pixDataForPayload);
        
        // 2. Gera QR Code DataURL
        const qrCodeDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'H', margin: 2, scale: 8 });
        
        const baseFileName = `pix_${pixDataForPayload.txid || i}`;

        // A. Exportar Payload TXT
        if (exportPayloads) {
            zip.file(`${baseFileName}_payload.txt`, payload);
        }

        // B. Exportar QR Code PNG
        if (exportQrCodes) {
            // Converte DataURL para Blob para adicionar ao ZIP
            const response = await fetch(qrCodeDataUrl);
            const qrBlob = await response.blob();
            zip.file(`${baseFileName}_qr.png`, qrBlob);
        }

        // C. Exportar Cartão PNG
        if (exportCards) {
            await new Promise(resolve => setTimeout(resolve, 10)); // Delay visual
            await drawCardOnCanvas(ctx, template, finalData, logo, qrCodeDataUrl);
            const pngBlob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'));
            if (pngBlob) {
                zip.file(`${baseFileName}_card.png`, pngBlob);
            }
        }
        
        setRows(produce(draft => { draft[i].status = 'success'; draft[i].txid = pixDataForPayload.txid; }));

      } catch (err: any) {
        setRows(produce(draft => { draft[i].status = 'error'; draft[i].error = err.message || "Erro"; }));
      }
      setProgress(((i + 1) / rows.length) * 100);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lote_pix_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setIsProcessing(false);
  };

  // Componente Seletor de Série
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
                setActivePreviewData(draft[index].data); // Atualiza preview ao digitar
            }
        }));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium mb-1">Regional</label>
                    <select value={selectedRegionalId} onChange={e => { setSelectedRegionalId(e.target.value); setSelectedCityId(''); setSelectedCongregations([]); }} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Selecione...</option>
                        {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Cidade</label>
                    <select value={selectedCityId} onChange={e => { setSelectedCityId(e.target.value); setSelectedCongregations([]); }} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" disabled={!selectedRegionalId}>
                        <option value="">Selecione...</option>
                        {domain.cities.filter(c => c.regionalId === selectedRegionalId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Finalidade Base</label>
                <select value={selectedPurposeId} onChange={e => setSelectedPurposeId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" disabled={!selectedCityId}>
                    <option value="">Selecione...</option>
                    {domain.purposes.map(p => <option key={p.id} value={p.id}>{p.displayLabel}</option>)}
                </select>
            </div>

            {selectedCityId && (
                <div className="border rounded p-3 max-h-48 overflow-y-auto space-y-2 bg-secondary/10">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold">Igrejas em {domain.cities.find(c => c.id === selectedCityId)?.name}:</p>
                        <button 
                            onClick={() => setSelectedCongregations(congregationsInCity.map(c => c.id))}
                            className="text-xs text-primary hover:underline"
                        >
                            Selecionar Todas
                        </button>
                    </div>
                    {congregationsInCity.map(cong => (
                        <label key={cong.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/20 p-1 rounded">
                            <input 
                                type="checkbox" 
                                checked={selectedCongregations.includes(cong.id)}
                                onChange={() => handleToggleCongregation(cong.id)}
                                disabled={!selectedPurposeId}
                            />
                            <span>{cong.name} ({cong.shortPrefix})</span>
                        </label>
                    ))}
                </div>
            )}
            
            {rows.length > 0 && (
                <div className="border rounded p-3 space-y-3 bg-card mt-4">
                    <p className="font-semibold text-primary text-sm">Edição em Série ({rows.length} itens)</p>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                        {rows.map(row => (
                            <div key={row.id} className="flex items-center gap-2 p-2 border rounded hover:bg-secondary/10 transition-colors">
                                <button 
                                    onClick={() => setActivePreviewData(row.data)}
                                    className="p-1.5 rounded-full text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                                    title="Ver Preview"
                                >
                                    <Eye size={16} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{row.data.neighborhood}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{row.data.txid}</p>
                                </div>
                                <TextField
                                    label=""
                                    placeholder="Mensagem"
                                    value={row.data.message}
                                    onChange={e => handleUpdateMessage(row.id, e.target.value)}
                                    className="h-8 text-xs w-32"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      
      {/* COLUNA ESQUERDA: Controles e Lista */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-6">
        <div>
            <h2 className="text-lg font-semibold">Gerar em Lote</h2>
            <p className="text-sm text-muted-foreground">Selecione o modo e configure os dados.</p>
        </div>
        
        <div className="flex gap-2 border-b pb-4">
            <button 
                onClick={() => { setMode('series'); setResolvedProfile(null); setRows([]); setTextInput(''); setActivePreviewData(null); }} 
                className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${mode === 'series' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
            >
                Modo Série (Igrejas)
            </button>
            <button 
                onClick={() => { setMode('csv'); setResolvedProfile(null); setRows([]); setTextInput(''); setActivePreviewData(null); }} 
                className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${mode === 'csv' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
            >
                Modo CSV
            </button>
        </div>

        {mode === 'csv' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="border p-4 rounded-md bg-secondary/10">
                    <h3 className="text-xs font-bold mb-3 uppercase text-muted-foreground">1. Dados Fixos</h3>
                    <HierarchySelector onProfileResolved={setResolvedProfile} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">2. Valores Variáveis (CSV)</label>
                    <textarea
                        value={textInput}
                        onChange={handleTextChange}
                        disabled={!resolvedProfile}
                        placeholder={resolvedProfile ? "10,00\n20,00, MENSAGEM" : "Selecione os dados fixos acima..."}
                        className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    />
                </div>
                <Dropzone onDrop={handleFileDrop} accept={{ 'text/csv': ['.csv'] }} label="Ou Arraste Arquivo CSV" description=""/>
            </div>
        )}
        
        {mode === 'series' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                {renderSeriesSelector()}
            </div>
        )}

        {/* Opções de Exportação (Checkboxes) */}
        <div className="bg-secondary/20 p-4 rounded-lg border border-secondary">
             <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                 <Settings size={16} /> Opções de Exportação (ZIP)
             </h3>
             <div className="space-y-2">
                 <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={exportCards} onChange={e => setExportCards(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                     <span className="text-sm">Gerar Cartões (Imagens PNG com Template)</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={exportQrCodes} onChange={e => setExportQrCodes(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                     <span className="text-sm">Gerar QR Codes Individuais (Imagens PNG)</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={exportPayloads} onChange={e => setExportPayloads(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                     <span className="text-sm">Gerar Payload Texto (TXT Copia e Cola)</span>
                 </label>
             </div>
             <p className="text-xs text-muted-foreground mt-2">
                Template atual: <strong>{template.name}</strong>
             </p>
        </div>

        {/* Botão de Ação Principal */}
        {rows.length > 0 && (
            <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso: {rows.filter(r => r.status === 'success').length}/{rows.length}</span>
                </div>
                <button
                    onClick={startBatchProcess}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-bold bg-green-600 text-white hover:bg-green-700 h-12 px-4 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</> : <><Download className="mr-2 h-5 w-5" /> Baixar ZIP ({rows.length} itens)</>}
                </button>
            </div>
        )}
      </div>
      
      {/* COLUNA DIREITA: Preview (Sticky) */}
      <div className="space-y-8 sticky top-24">
         <div className="border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Card Preview</h3>
                {activePreviewData && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{activePreviewData.neighborhood || 'Item Selecionado'}</span>}
            </div>
            
            {/* Apenas o CardPreview é exibido aqui, conforme solicitado */}
            <CardPreview
                template={template}
                formData={activePreviewData || baseData}
                logo={logo}
                payload={null} 
                warnings={[]}
            />
         </div>
         
         {/* Nota informativa sobre o preview */}
         <div className="text-xs text-muted-foreground text-center px-4">
             <p>Este preview é apenas para conferência visual.</p>
             <p>Os QR Codes reais serão gerados no ZIP conforme as opções selecionadas.</p>
         </div>
      </div>

    </div>
  );
};

export default BatchTab;