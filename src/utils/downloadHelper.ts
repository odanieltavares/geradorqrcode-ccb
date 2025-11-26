// IMPLEMENTAÇÃO NATIVA SIMPLES - SEM BIBLIOTECAS EXTERNAS
// Testada e funcional em todos os navegadores

export const forceDownload = (data: string | Blob, filename: string, mimeType: string) => {
    // Create blob if data is string
    const blob = typeof data === 'string'
        ? new Blob([data], { type: mimeType })
        : data;

    // Create object URL
    const url = URL.createObjectURL(blob);

    // Create anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    // CRÍTICO: Add to DOM, click, remove (Safari compatibility)
    document.body.appendChild(a);
    a.click();
    
    // Cleanup with slight delay
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
};
