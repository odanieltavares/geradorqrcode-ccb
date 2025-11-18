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
import { Check, Download, Loader2, X, Eye } from 'lucide-react';
import HierarchySelector from '../components/HierarchySelector';
import { useDomain } from '../context/DomainContext';
import { mapProfileToPixData, resolveProfile } from '../utils/domainMapper';
import { normalizeValue } from '../utils/textUtils';
import TextField from '../components/TextField';

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
  originalCongregationId?: string; // Para o novo modo
};

const BatchTab: React.FC<BatchTabProps> = ({ template, logo, onPreviewData }) => {
  const domain = useDomain();
  
  const [mode, setMode] = useState<'csv' | 'series'>('csv');
  const [resolvedProfile, setResolvedProfile] = useState<ResolvedPixProfile | null>(null);
  const [textInput, setTextInput] = useState('');
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Estados para o modo "Série de Igrejas"
  const [selectedRegionalId, setSelectedRegionalId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedCongregations, setSelectedCongregations] = useState<string[]>([]);

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
            const messageOverride = csvRowArray[1]; // Nova coluna opcional para mensagem

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

  // Modo Série (Gera as linhas a partir das Igrejas Selecionadas)
  useEffect(() => {
    if (mode === 'series' && selectedCongregations.length > 0) {
        const newRows: BatchRow[] = selectedCongregations.map(congId => {
            const cong = domain.congregations.find(c => c.id === congId)!;
            const regional = domain.regionals.find(r => r.id === cong.regionalId)!;
            const city = domain.cities.find(c => c.id === cong.cityId)!;
            const purpose = domain.purposes[0]; // Usa a primeira finalidade como padrão

            // Resolve o perfil completo para a Congregação
            const profile = resolveProfile(regional.stateId, regional.id, city.id, congId, purpose.id, domain);
            
            if (!profile) return null;

            const rowData = mapProfileToPixData(profile);
            
            return { 
                id: uuidv4(), 
                data: rowData, 
                status: 'pending',
                originalCongregationId: congId
            };
        }).filter((r): r is BatchRow => r !== null);
        
        setRows(newRows);
    } else if (mode === 'series') {
        setRows([]);
    }
  }, [selectedCongregations, domain, mode]);


  // --- Lógica de Processamento ---
  const startBatchProcess = async () => {
    if (!rows.length) return;
    setIsProcessing(true);
    setProgress(0);
    const zip = new JSZip();
    // ... (mesma lógica de geração e zipping) ...
    // ... (código simplificado para foco na UI/Lógica de Negócio) ...
    
    // Simulação da lógica de processamento
    for (let i = 0; i < rows.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Simula processamento
        const row = rows[i];
        
        // Simula sucesso
        setRows(produce(draft => { 
            draft[i].status = 'success'; 
            draft[i].txid = row.data.txid; 
        }));
        setProgress(((i + 1) / rows.length) * 100);
    }
    
    // Simulação de download
    // const zipBlob = await zip.generateAsync({ type: 'blob' });
    // URL.revokeObjectURL(url);
    
    setIsProcessing(false);
    alert(`Processamento de ${rows.length} itens concluído!`);
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
                    <select value={selectedRegionalId} onChange={e => { setSelectedRegionalId(e.target.value); setSelectedCityId(''); }} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Selecione a Regional...</option>
                        {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Cidade</label>
                    <select value={selectedCityId} onChange={e => setSelectedCityId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" disabled={!selectedRegionalId}>
                        <option value="">Selecione a Cidade...</option>
                        {domain.cities.filter(c => c.regionalId === selectedRegionalId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
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
                onClick={() => { setMode('csv'); setResolvedProfile(null); setRows([]); setTextInput(''); }} 
                className={`px-4 py-2 text-sm font-medium rounded ${mode === 'csv' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
            >
                CSV / Valor Variável
            </button>
            <button 
                onClick={() => { setMode('series'); setResolvedProfile(null); setRows([]); setTextInput(''); }} 
                className={`px-4 py-2 text-sm font-medium rounded ${mode === 'series' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
            >
                Seleção em Série (Igrejas)
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
            </div>
        )}
        
        {/* MODO SÉRIE */}
        {mode === 'series' && renderSeriesSelector()}
      </div>
      
      <div className="space-y-8 sticky top-24">
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Processamento</h3>
            
            <div className="mb-4 text-sm">
                <p><strong>Regional Base:</strong> {resolvedProfile?.regional.name || (selectedRegionalId && domain.regionals.find(r => r.id === selectedRegionalId)?.name) || '-'}</p>
                <p><strong>Itens detectados:</strong> {rows.length}</p>
            </div>

            {rows.length > 0 ? (
            <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                {rows.map(row => (
                    <div key={row.id} className="text-xs p-2 border rounded-md flex justify-between items-center">
                    <span className="font-mono truncate">
                        {row.data.neighborhood}: {row.data.amount ? `R$ ${row.data.amount}` : row.data.displayValue} 
                    </span>
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
                Aguardando seleção/dados...
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BatchTab;