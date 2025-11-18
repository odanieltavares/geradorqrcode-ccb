import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QrPreviewProps {
  qrCodeValue?: string;
  txid?: string;
}

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg> );
const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg> );
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> );


const QrPreview: React.FC<QrPreviewProps> = ({ qrCodeValue, txid }) => {
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);

    const getCanvas = (): HTMLCanvasElement | null => document.getElementById('qr-code-canvas') as HTMLCanvasElement;

    const downloadQRCode = () => {
        const canvas = getCanvas();
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `qrcode_${txid || 'pix'}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 2000);
        }
    };
    
    const copyToClipboard = () => {
        const canvas = getCanvas();
        if (canvas && navigator.clipboard?.write) {
            canvas.toBlob((blob) => {
                if (blob) {
                    navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    });
                }
            });
        } else {
            alert('A cópia de imagens para a área de transferência não é suportada neste navegador.');
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">QR Code Preview</h2>
                {qrCodeValue && (
                     <div className="flex items-center gap-2">
                        <button onClick={copyToClipboard} title="Copiar Imagem" className="p-2 rounded-md hover:bg-secondary disabled:opacity-50" disabled={copied}>
                            {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                        <button onClick={downloadQRCode} title="Baixar PNG" className="p-2 rounded-md hover:bg-secondary disabled:opacity-50" disabled={downloaded}>
                            {downloaded ? <CheckIcon className="w-4 h-4 text-green-500" /> : <DownloadIcon className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-grow flex items-center justify-center aspect-square">
                 {qrCodeValue ? (
                    <QRCodeCanvas 
                        id="qr-code-canvas"
                        value={qrCodeValue}
                        size={256}
                        level="H"
                        className="w-full h-full max-w-[256px] max-h-[256px]"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-secondary rounded-lg w-full">
                        <p className="text-muted-foreground text-center">Preview indisponível</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QrPreview;