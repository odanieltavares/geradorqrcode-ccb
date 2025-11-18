import React, { useState } from 'react';

interface PayloadPreviewProps {
  payload?: string;
  txid?: string;
}

const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg> );
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> );
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg> );

const PayloadPreview: React.FC<PayloadPreviewProps> = ({ payload, txid }) => {
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);

    const handleCopy = () => {
        if (payload) {
            navigator.clipboard.writeText(payload);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const handleDownload = () => {
        if (payload) {
            const blob = new Blob([payload], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payload_${txid || 'pix'}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 2000);
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Payload (EMV)</h2>
                {payload && (
                    <div className="flex items-center gap-2">
                        <button onClick={handleCopy} title="Copiar Payload" className="p-2 rounded-md hover:bg-secondary disabled:opacity-50" disabled={copied}>
                            {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                        <button onClick={handleDownload} title="Baixar .txt" className="p-2 rounded-md hover:bg-secondary disabled:opacity-50" disabled={downloaded}>
                            {downloaded ? <CheckIcon className="w-4 h-4 text-green-500" /> : <DownloadIcon className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-grow">
                {payload ? (
                    <textarea
                        readOnly
                        value={payload}
                        className="w-full h-full min-h-[200px] bg-secondary text-secondary-foreground rounded-md p-3 text-xs font-mono resize-none focus:outline-none"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-secondary rounded-lg w-full aspect-square">
                        <p className="text-muted-foreground text-center">Preview indisponível</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayloadPreview;