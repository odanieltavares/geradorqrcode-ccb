import { PixData, FormErrors } from '../types';
import { stripAccents } from '../utils/textUtils';

// ===== UTILS =====
const sanitize = (s: string | undefined, max: number, allowedChars: RegExp): string => {
    if (!s) return '';
    return stripAccents(s.toString())
        .toUpperCase()
        .replace(allowedChars, '')
        .slice(0, max);
};

export const formatCurrency = (value: string): string => {
    if (!value) return '';
    let numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    numericValue = (parseInt(numericValue, 10) / 100).toFixed(2);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(numericValue));
};

export const unformatCurrency = (value: string): string => {
    if (!value) return '';
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return (parseInt(numericValue, 10) / 100).toFixed(2);
};

// ===== VALIDATION =====
export const validatePixData = (data: PixData): FormErrors => {
    const errors: FormErrors = {};
    if (!data.name || data.name.length < 3) errors.name = 'Nome é obrigatório.';
    if (!data.key || data.key.length < 11) errors.key = 'Chave PIX inválida.';
    if (!data.city || data.city.length < 3) errors.city = 'Cidade é obrigatória.';
    if (!data.txid || !/^[A-Z0-9]{1,25}$/i.test(data.txid)) errors.txid = 'TXID inválido (1-25 chars, A-Z, 0-9).';
    if (data.amount && !/^\d+(\.\d{2})?$/.test(data.amount)) errors.amount = 'Valor inválido.';
    return errors;
};

// ===== PIX EMV LOGIC =====
const id = (tag: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${tag}${len}${value}`;
};

// CRC16-CCITT (poly 0x1021, init 0xFFFF)
export const crc16 = (payload: string): string => {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= (payload.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};

export function generatePixPayload(data: PixData): string {
    const amount = data.amount && parseFloat(data.amount) > 0 ? parseFloat(data.amount).toFixed(2) : undefined;

    // Sanitize fields according to PIX rules
    const name = sanitize(data.name, 25, /[^A-Z0-9 ]/g);
    const city = sanitize(data.city, 15, /[^A-Z0-9 ]/g);
    const txid = sanitize(data.txid, 25, /[^A-Z0-9]/g) || '***';
    const message = data.message ? stripAccents(data.message).slice(0, 72) : '';

    const payload: string[] = [
        id('00', '01'), // Payload Format Indicator
        id('01', amount ? '12' : '11'), // Point of Initiation Method (12 for amount, 11 for no amount)
        id('26', // Merchant Account Information
            id('00', 'br.gov.bcb.pix') +
            id('01', data.key.trim()) +
            (message ? id('02', message) : '')
        ),
        id('52', '0000'), // Merchant Category Code
        id('53', '986'), // Transaction Currency (BRL)
        ...(amount ? [id('54', amount)] : []), // Transaction Amount
        id('58', 'BR'), // Country Code
        id('59', name), // Merchant Name
        id('60', city), // Merchant City
        id('62', // Additional Data Field Template
            id('05', txid)
        )
    ];

    const payloadStr = payload.join('') + '6304'; // Add CRC16 placeholder
    const crc = crc16(payloadStr);

    return `${payloadStr}${crc}`;
}
