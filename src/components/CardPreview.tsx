import React, { useRef, useEffect, useCallback, useState } from 'react';
import QRCode from 'qrcode';
import { Template, PixData, TemplateWarning } from '../types';
import { drawCardOnCanvas } from '../utils/cardGenerator';
import { AlertTriangle, Download, Printer, Check, Loader2 } from 'lucide-react';

interface CardPreviewProps {
  template: Template;
  formData: PixData;
  logo: string | null;
  payload: string | null;
  warnings: TemplateWarning[];
}

const CardPreview: React.FC<CardPreviewProps> = ({ template, formData, logo, payload, warnings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  
  // Filtra apenas avisos de campos vazios que são obrigatórios
  const missingFields = warnings.filter(w => w.type === 'placeholder');
  const hasCriticalError = !payload && missingFields.length > 0;

  useEffect(() => {
    let isActive = true;
    setIsDrawing(true);
    
    const renderCard = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        let qrCodeDataUrl = '';

        // Tenta gerar o QR apenas se houver payload
        if (payload) {
            try {
                qrCodeDataUrl = await QRCode.toDataURL(payload, {
                    errorCorrectionLevel: 'H',
                    margin: 2,
                    scale: 8,
                });
            } catch (e) {
                console.warn("Ainda não foi possível gerar o QR Code visual.");
            }
        }

        // Desenha o cartão (Background, Textos, Assets)
        await drawCardOnCanvas(ctx, template, formData, logo, qrCodeDataUrl);
        
        if (isActive) setIsDrawing(false);

      } catch (err) {
        console.error('Erro de renderização:', err);
        if (isActive) setIsDrawing(false);
      }
    };

    // Debounce para evitar travamento na digitação
    const timer = setTimeout(() => renderCard(), 100);
    return () => { 
      isActive = false; 
      clearTimeout(timer);
    };
  }, [template, formData, logo, payload]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `card_${formData.txid || 'pix'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    }
  }, [formData.txid]);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    win?.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${dataUrl}" style="max-height:100%;max-width:100%;"/></body><script>window.onload=function(){window.print();window.close();}</script></html>`);
    win?.document.close();
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-secondary/30 flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
            {isDrawing ? <Loader2 className="animate-spin w-4 h-4"/> : null} Preview
        </h2>
        <div className="flex gap-2">
            <button onClick={handleDownload} className="flex items-center gap-2 text-xs px-3 py-1.5 border rounded hover:bg-background transition-colors disabled:opacity-50" disabled={isDrawing || downloaded || hasCriticalError}>
                {downloaded ? <Check size={14} className="text-green-600"/> : <Download size={14}/>} PNG
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 text-xs px-3 py-1.5 border rounded hover:bg-background transition-colors disabled:opacity-50" disabled={isDrawing || hasCriticalError}>
                <Printer size={14} /> Imprimir
            </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative bg-zinc-100 dark:bg-zinc-900/50 p-6 flex justify-center">
        
        {/* Overlay de Aviso (Mais bonito que desenhar no canvas) */}
        {hasCriticalError && !isDrawing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm">
                <div className="bg-card border border-destructive/50 text-card-foreground p-4 rounded-lg shadow-lg max-w-xs text-center">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="font-bold text-sm mb-2">Dados Incompletos</p>
                    <p className="text-xs text-muted-foreground mb-3">Preencha os campos para gerar o QR Code:</p>
                    <ul className="text-xs text-left space-y-1 bg-secondary/50 p-2 rounded">
                        {missingFields.map(w => (
                            <li key={w.key} className="flex items-center gap-2 text-destructive">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                                Tradução: <strong>{w.key}</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}

        <canvas
          ref={canvasRef}
          width={template.canvas.width}
          height={template.canvas.height}
          className="w-full h-auto max-w-[400px] shadow-md rounded bg-white transition-all duration-300"
          style={{ filter: hasCriticalError ? 'grayscale(100%) blur(1px)' : 'none' }}
        />
      </div>
    </div>
  );
};

export default CardPreview;