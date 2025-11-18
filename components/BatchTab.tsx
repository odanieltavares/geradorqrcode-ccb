import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { produce } from 'immer';
import { PixData, Template, Preset, TemplateWarning, Asset } from '../types';
import { generatePixPayload, validatePixData } from '../lib/pix';
import { getPixDataFromForm } from '../utils/pixGenerator';
import { drawCardOnCanvas } from '../utils/cardGenerator';
import { Dropzone } from './Dropzone';
import { Check, Download, Loader2, X } from 'lucide-react';
import CardPreview from './CardPreview';
import { normalizeValue } from '../utils/textUtils';

interface BatchTabProps {
  baseFormData: PixData;
  template: Template;
  logo: string | null;
  presets: Preset[];
}

type BatchRow = {
  id: number;
  data: PixData;
  status: 'pending' | 'success' | 'error';
  error?: string;
  txid?: string;
};

const BatchTab: React.FC<BatchTabProps> = ({ baseFormData, template, logo, presets }) => {
  const [textInput, setTextInput] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState('');

  // --- Preview Logic for the first item ---
  const previewData = useMemo(() => {
    if (rows.length === 0) return null;
    return { ...baseFormData, ...rows[0].data };
  }, [rows, baseFormData]);

  const pixDataForPayload = useMemo(() => {
      if (!previewData) return null;
      return getPixDataFromForm(template, previewData);
  }, [template, previewData]);

  const errors = useMemo(() => {
      if (!pixDataForPayload) return {};
      return validatePixData(pixDataForPayload);
  }, [pixDataForPayload]);

  const payload = useMemo(() => {
      if (!pixDataForPayload || Object.keys(errors).length > 0) return null;
      return generatePixPayload(pixDataForPayload);
  }, [pixDataForPayload, errors]);
  
  const warnings = useMemo((): TemplateWarning[] => {
    if (!previewData) return [];
    const warns: TemplateWarning[] = [];
    const combinedText =
        (template?.blocks || [])
            .flatMap(b => (b.type === 'text' ? [b.text] : []))
            .join(' ') +
        ' ' +
        Object.values(template?.assets || {})
            .map((a: Asset) => a.source)
            .join(' ');
    
    const placeholders = combinedText.match(/\{\{(\w+)\}\}/g) || [];
    for (const p of placeholders) {
        const key = p.replace(/\{|\}/g, '');
        if (!previewData[key]) {
            warns.push({ type: 'placeholder', key });
        }
    }
    return warns;
  }, [template, previewData]);
  // --- End of Preview Logic ---

  const getInitialPlaceholder = () => {
    if (template?.formSchema?.length > 0) {
        const firstField = template.formSchema[0];
        return `Ex: ${firstField.placeholder || firstField.label}`;
    }
    return 'Cole os dados aqui, separados por vírgula.';
  };

  useEffect(() => {
    setDynamicPlaceholder(getInitialPlaceholder());
  }, [template]);


  const parseAndSetRows = (input: string) => {
    Papa.parse<string[]>(input, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const expectedHeaders = template?.formSchema?.map(f => f.id) || [];
        const newRows: BatchRow[] = results.data.map((csvRowArray, index) => {
            const csvData: PixData = {};
            expectedHeaders.forEach((header, i) => {
                if (csvRowArray[i] !== undefined) {
                    const fieldSchema = template?.formSchema?.find(f => f.id === header);
                    csvData[header as keyof PixData] = normalizeValue(csvRowArray[i], fieldSchema);
                }
            });

            const txid = `${csvData.txid || ''}`.toUpperCase().replace(/[^A-Z0-9.\-_*@/]/g, '').slice(0, 25);
            const rowData = {
                ...baseFormData,
                ...csvData,
                txid: txid || `LOTE_${index + 1}`,
            };
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
        parseAndSetRows(text);
      };
      reader.readAsText(files[0]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const currentValue = e.target.value;
    setTextInput(currentValue);
    parseAndSetRows(currentValue);

    const lines = currentValue.split('\n');
    const lastLine = lines[lines.length - 1] || '';
    const fields = lastLine.split(',');
    const nextFieldIndex = fields.length - 1;

    if (template?.formSchema && nextFieldIndex < template.formSchema.length) {
        const nextField = template.formSchema[nextFieldIndex];
        setDynamicPlaceholder(`Próximo: ${nextField.label} (Ex: ${nextField.placeholder || '...'})`);
    } else {
        setDynamicPlaceholder('Pressione Enter para a próxima linha...');
    }
  };
  
  const handleDownloadModel = () => {
      const headers = template?.formSchema?.map(f => f.id).join(',') || '';
      const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "modelo.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  useEffect(() => {
    if (selectedPresets.length > 0) {
        const presetData = selectedPresets.map((presetId, index) => {
          const preset = presets.find(p => p.id === presetId);
          return {
            id: index,
            data: preset?.formValues || {},
            status: 'pending' as const
          };
        });
        setRows(presetData);
        setTextInput(''); 
    } else {
        if(textInput) parseAndSetRows(textInput);
        else setRows([]);
    }
  }, [selectedPresets, presets]);


  const startBatchProcess = async () => {
    setIsProcessing(true);
    setProgress(0);
    const zip = new JSZip();
    const report: any[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = template.canvas.width;
    canvas.height = template.canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const finalData = { ...baseFormData, ...row.data };
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
          zip.file(`card_${pixDataForPayload.txid}.png`, pngBlob);
          zip.file(`payload_${pixDataForPayload.txid}.txt`, payload);
          
          setRows(produce(draft => { draft[i].status = 'success'; draft[i].txid = pixDataForPayload.txid; }));
          report.push({ linha: i + 1, status: 'sucesso', txid: pixDataForPayload.txid, erro: '' });
        } else {
            throw new Error('Falha ao gerar PNG do canvas.');
        }

      } catch (err: any) {
        setRows(produce(draft => { draft[i].status = 'error'; draft[i].error = err.message; }));
        report.push({ linha: i + 1, status: 'erro', txid: pixDataForPayload.txid, erro: err.message });
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
            <p className="text-sm text-muted-foreground">Selecione cadastros, envie um CSV ou cole os dados.</p>
        </div>
        
        {presets.length > 0 && (
            <div className="space-y-2">
                <label className="text-sm font-medium">1. Selecionar Cadastros</label>
                 <select 
                    multiple
                    value={selectedPresets}
                    onChange={(e) => setSelectedPresets(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))}
                    className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    {presets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Use Ctrl/Cmd para selecionar múltiplos. Limpa outras entradas.</p>
            </div>
        )}

        <div className="space-y-2">
            <label className="text-sm font-medium">2. Colar Dados (sem cabeçalho)</label>
             <p className="text-xs text-muted-foreground mb-2">
                Ordem das colunas: {template?.formSchema?.map(f => f.label).join(', ') || 'N/A'}
            </p>
            <textarea
                value={textInput}
                onChange={handleTextChange}
                placeholder={dynamicPlaceholder}
                className="w-full h-32 min-h-[128px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                disabled={selectedPresets.length > 0}
            />
        </div>
        
         <div className="space-y-2">
            <label className="text-sm font-medium">Ou Enviar Arquivo CSV</label>
            <Dropzone 
                onDrop={handleFileDrop} 
                accept={{ 'text/csv': ['.csv'] }}
                label="Clique ou arraste um arquivo CSV aqui"
                description="O conteúdo será colado na área de texto acima."
            />
             <button onClick={handleDownloadModel} className="text-sm text-primary underline mt-2 inline-flex items-center gap-1">
                <Download size={14} /> Baixar Modelo CSV (cabeçalho)
             </button>
        </div>
      </div>
      
      <div className="space-y-8 sticky top-24">
        {rows.length > 0 && previewData && (
          <CardPreview
            template={template}
            formData={previewData}
            logo={logo}
            payload={payload}
            warnings={warnings}
          />
        )}
        
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Processamento</h3>
            {rows.length > 0 ? (
            <div className="space-y-4">
                <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                {rows.map(row => (
                    <div key={row.id} className="text-xs p-2 border rounded-md flex justify-between items-center">
                    <span className="font-mono truncate">{row.data.txid || JSON.stringify(row.data)}</span>
                    {row.status === 'success' && <Check className="w-4 h-4 text-green-500" />}
                    {row.status === 'error' && <X className="w-4 h-4 text-destructive" title={row.error} />}
                    </div>
                ))}
                </div>
                <button
                onClick={startBatchProcess}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando {Math.round(progress)}%</> : `Processar ${rows.length} Itens`}
                </button>
            </div>
            ) : (
            <div className="text-center text-sm text-muted-foreground py-10">
                Nenhum dado para processar.
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BatchTab;