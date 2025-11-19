import React, { useRef, useEffect, useCallback, useState } from 'react';
import QRCode from 'qrcode';
import { Template, PixData, TemplateWarning } from '../types';
import { drawCardOnCanvas } from '../utils/cardGenerator';

interface CardPreviewProps {
  template: Template;
  formData: PixData;
  logo: string | null;
  payload: string | null;
  warnings: TemplateWarning[];
}

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3" /></svg>;
const PrinterIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>;
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;

const CardPreview: React.FC<CardPreviewProps> = ({ template, formData, logo, payload, warnings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    let isActive = true;
    setIsDrawing(true);
    
    const renderCard = async () => {
      const canvas = canvasRef.current;
      // CORREÇÃO: Não aborta mais se !payload. Apenas verifica se tem canvas.
      if (!canvas) {
          setIsDrawing(false);
          return;
      };
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsDrawing(false);
        return;
      };

      try {
        let qrCodeDataUrl = '';

        // CORREÇÃO: Gera o QR Code apenas se o payload existir.
        // Se não existir, qrCodeDataUrl fica vazio e o gerador apenas pula o desenho do QR,
        // mas mantém o resto do cartão.
        if (payload) {
            qrCodeDataUrl = await QRCode.toDataURL(payload, {
                errorCorrectionLevel: 'H',
                margin: 2,
                scale: 8,
            });
        }

        await drawCardOnCanvas(ctx, template, formData, logo, qrCodeDataUrl);
        if (isActive) setIsDrawing(false);

      } catch (err) {
        console.error('Failed to render card:', err);
        // Desenha mensagem de erro no canvas se falhar drasticamente
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '24px sans-serif';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Erro ao renderizar', canvas.width / 2, canvas.height / 2);
        if (isActive) setIsDrawing(false);
      }
    };

    // Pequeno delay para evitar flickering em atualizações rápidas
    const timer = setTimeout(() => renderCard(), 50);
    
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
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
        <html>
            <head><title>Imprimir Cartão PIX</title></head>
            <body style="margin: 0; text-align: center;">
                <img src="${dataUrl}" style="max-width: 100%; max-height: 100vh;" onload="window.print(); window.close();" />
            </body>
        </html>
    `);
    printWindow?.document.close();
};

  const placeholderWarnings = warnings.filter(w => w.type === 'placeholder');

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Card Preview</h2>
        <div className="flex gap-2">
            <button onClick={handleDownload} className="flex items-center justify-center gap-2 text-sm px-3 py-1.5 border border-border rounded-md hover:bg-secondary disabled:opacity-50 w-[100px]" disabled={isDrawing || downloaded}>
                {downloaded ? (
                    <><CheckIcon className="w-4 h-4 text-green-500" /> Baixado</>
                ) : (
                    <><DownloadIcon className="w-4 h-4" /> PNG</>
                )}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 text-sm px-3 py-1.5 border border-border rounded-md hover:bg-secondary disabled:opacity-50" disabled={isDrawing}>
                <PrinterIcon className="w-4 h-4" /> Imprimir
            </button>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4 bg-secondary rounded-lg aspect-[1240/1748] relative">
        {isDrawing && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground z-10 bg-white/50">Renderizando...</div>}
        <canvas
          ref={canvasRef}
          width={template.canvas.width}
          height={template.canvas.height}
          className="w-full h-full transition-opacity duration-500"
          // Não escondemos mais totalmente o canvas durante o desenho para evitar "piscar" branco
          style={{ opacity: isDrawing ? 0.7 : 1 }}
        />
      </div>
       {placeholderWarnings.length > 0 && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg p-3">
                <p className="font-bold">Aviso:</p>
                <ul className="list-disc list-inside">
                    {placeholderWarnings.map((w, i) => w.type === 'placeholder' && (
                       <li key={i}>Campo <strong>{w.key}</strong> vazio.</li>
                    ))}
                </ul>
            </div>
       )}
    </div>
  );
};

export default CardPreview;