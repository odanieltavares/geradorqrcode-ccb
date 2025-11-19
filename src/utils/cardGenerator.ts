import { Template, PixData, Block, Font, Asset, TextBlock } from '../types';
import { replacePlaceholders } from './textUtils';

const loadedFonts = new Set<string>();

const loadFont = async (font: Font) => {
  const fontIdentifier = `${font.style}-${font.weight}-${font.family}`;
  if (loadedFonts.has(fontIdentifier)) {
    return;
  }
  
  const fontString = `${font.style} ${font.weight} 16px ${font.family}`;
  try {
    // Timeout para evitar travamento se a fonte não carregar
    await Promise.race([
        document.fonts.load(fontString),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Font load timeout')), 2000))
    ]);
    loadedFonts.add(fontIdentifier);
  } catch (e) {
    console.warn(`Fonte não carregada (usando fallback): ${font.family}`, e);
  }
};


const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

const getObjectFitSize = (
    contains: boolean,
    containerWidth: number,
    containerHeight: number,
    width: number,
    height: number
) => {
    const doRatio = width / height;
    const cRatio = containerWidth / containerHeight;
    let targetWidth = 0;
    let targetHeight = 0;
    const test = contains ? doRatio > cRatio : doRatio < cRatio;

    if (test) {
        targetWidth = containerWidth;
        targetHeight = targetWidth / doRatio;
    } else {
        targetHeight = containerHeight;
        targetWidth = targetHeight * doRatio;
    }

    return {
        width: targetWidth,
        height: targetHeight,
        x: (containerWidth - targetWidth) / 2,
        y: (containerHeight - targetHeight) / 2,
    };
};


const drawAsset = async (ctx: CanvasRenderingContext2D, asset: Asset, data: PixData, logo: string | null) => {
    let source = asset.source;
    if (source === '{{logo}}' && logo) {
        source = logo;
    } else {
        source = replacePlaceholders(source, data);
    }
    
    if (!source) return;

    try {
        const img = await loadImage(source);
        ctx.globalAlpha = asset.opacity ?? 1;

        if (asset.fit === 'contain') {
             const { x, y, width, height } = getObjectFitSize(true, asset.w, asset.h, img.width, img.height);
             ctx.drawImage(img, asset.x + x, asset.y + y, width, height);
        } else {
            ctx.drawImage(img, asset.x, asset.y, asset.w, asset.h);
        }
        
        ctx.globalAlpha = 1;
    } catch (e) {
        console.error(`Could not draw asset: ${source}`, e);
    }
};

const drawMixedWeightText = (ctx: CanvasRenderingContext2D, block: TextBlock, text: string) => {
    const separator = text.includes(':') ? ':' : text.includes('-') ? '-' : null;
    if (!separator) {
        ctx.fillText(text, block.x, block.y, block.maxWidth);
        return;
    }

    const parts = text.split(separator);
    if (parts.length >= 2) {
        const label = `${parts[0]}${separator} `;
        const value = parts.slice(1).join(separator).trim();
        
        ctx.font = `${block.font.style} 700 ${block.font.size}px ${block.font.family}`;
        ctx.fillText(label, block.x, block.y);

        const labelWidth = ctx.measureText(label).width;
        ctx.font = `${block.font.style} 400 ${block.font.size}px ${block.font.family}`;
        ctx.fillText(value, block.x + labelWidth, block.y);
    } else {
        ctx.fillText(text, block.x, block.y, block.maxWidth);
    }
};

const drawBlock = (ctx: CanvasRenderingContext2D, block: Block, data: PixData) => {
  switch (block.type) {
    case 'text':
      ctx.font = `${block.font.style} ${block.font.weight} ${block.font.size}px ${block.font.family}`;
      ctx.textAlign = block.align;
      ctx.fillStyle = '#000000'; 
      const text = replacePlaceholders(block.text, data);

      if (['detail-agency', 'detail-account', 'details-txid'].includes(block.id)) {
          drawMixedWeightText(ctx, block, text);
          break;
      }
      
      const lines = text.split('\n');
      if (lines.length > 1) {
          const lineHeight = (block.font.size ?? 16) * 1.2; 
          const startY = block.y - ((lines.length -1) * lineHeight / 2); 
          lines.forEach((line, index) => {
              ctx.fillText(line, block.x, startY + (index * lineHeight), block.maxWidth);
          });
      } else {
          ctx.fillText(text, block.x, block.y, block.maxWidth);
      }
      break;
    case 'rule':
      if (block.style === 'solid') {
        ctx.fillStyle = '#000000'; 
        ctx.fillRect(block.x, block.y, block.w, block.h);
      } else if (block.style === 'dashed') {
        ctx.beginPath();
        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = block.h > 0 ? block.h : 2; 
        if (block.dash) {
          ctx.setLineDash(block.dash);
        }
        ctx.moveTo(block.x, block.y);
        ctx.lineTo(block.x + block.w, block.y);
        ctx.stroke();
        ctx.setLineDash([]); 
      }
      break;
    case 'kv':
      block.rows.forEach((row, i) => {
          const yPos = block.y + (i * block.gapY);
          const label = replacePlaceholders(row[0], data);
          const value = replacePlaceholders(row[1], data);
          ctx.font = `${block.labelFont.style} ${block.labelFont.weight} ${block.labelFont.size}px ${block.labelFont.family}`;
          ctx.textAlign = 'left';
          ctx.fillStyle = '#000000';
          
          const lines = label.split('\n');
          lines.forEach((line, lineIndex) => {
            ctx.fillText(line, block.x, yPos + (lineIndex * (block.labelFont.size ?? 16) * 1.2));
          });

          if (value) {
            ctx.font = `${block.valueFont.style} ${block.valueFont.weight} ${block.valueFont.size}px ${block.valueFont.family}`;
            ctx.fillText(value, block.x + 200, yPos); 
          }
      });
      break;
    case 'box':
        ctx.beginPath();
        if(block.fill) {
            ctx.fillStyle = block.fill;
            ctx.fillRect(block.x, block.y, block.w, block.h);
        }
        if(block.stroke && block.strokeWidth) {
            ctx.strokeStyle = block.stroke;
            ctx.lineWidth = block.strokeWidth;
            ctx.strokeRect(block.x, block.y, block.w, block.h);
        }
        break;
  }
};


export const drawCardOnCanvas = async (
  ctx: CanvasRenderingContext2D,
  template: Template,
  formData: PixData,
  logo: string | null,
  qrCodeDataUrl: string,
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = template?.canvas?.background || '#FFFFFF';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const finalityOrTxid = formData.message 
    ? `FINALIDADE: ${formData.message}`
    : `IDENTIFICADOR: ${formData.txid}`;
  const enhancedData = { ...formData, finalityOrTxid };

  await Promise.all((template?.fonts || []).map(loadFont));
  
  for (const key in (template?.assets || {})) {
    await drawAsset(ctx, template.assets[key], enhancedData, logo);
  }

  if (qrCodeDataUrl && template?.qr) {
    try {
        const qrImg = await loadImage(qrCodeDataUrl);
        ctx.drawImage(qrImg, template.qr.x, template.qr.y, template.qr.size, template.qr.size);
    } catch (e) {
        console.error('Could not draw QR code', e);
    }
  }
  
  (template?.blocks || []).forEach(block => drawBlock(ctx, block, enhancedData));
};