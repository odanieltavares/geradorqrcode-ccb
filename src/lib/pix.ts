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

// ===== VALIDATION HELPERS =====

/**
 * Valida CNPJ com dígitos verificadores
 */
const validateCnpj = (cnpj: string): boolean => {
    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14) return false;

    // Rejeita CNPJs com todos dígitos iguais
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // Calcula primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

    // Calcula segundo dígito verificador
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

    return parseInt(cleaned[12]) === digit1 && parseInt(cleaned[13]) === digit2;
};

// ===== VALIDATION =====
export const validatePixData = (data: PixData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.name || data.name.length < 3) {
        errors.name = 'Nome é obrigatório.';
    }

    // CORREÇÃO CRÍTICA: Validação robusta de chave PIX
    if (!data.key || data.key.length < 11) {
        errors.key = 'Chave PIX inválida.';
    } else {
        const cleanKey = data.key.replace(/\D/g, '');
        // Valida CNPJ se tiver 14 dígitos
        if (cleanKey.length === 14 && !validateCnpj(cleanKey)) {
            errors.key = 'CNPJ inválido. Verifique os dígitos.';
        }
    }

    if (!data.city || data.city.length < 3) {
        errors.city = 'Cidade é obrigatória.';
    }

    if (!data.txid || !/^[A-Z0-9]{1,25}$/i.test(data.txid)) {
        errors.txid = 'TXID inválido (1-25 chars, A-Z, 0-9).';
    }

    if (data.amount && !/^\d+(\.\d{2})?$/.test(data.amount)) {
        errors.amount = 'Valor inválido.';
    }

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
    // CORREÇÃO 3: Mensagem deve ser MAIÚSCULA, sem acentos
    const message = data.message ? stripAccents(data.message).toUpperCase().slice(0, 72) : '';

    // CORREÇÃO 1: Limpar chave PIX (CNPJ) - remover TODOS os caracteres não numéricos
    const cleanKey = data.key.replace(/[^0-9]/g, '').trim();

    const payload: string[] = [
        id('00', '01'), // Payload Format Indicator
        id('01', amount ? '12' : '11'), // Point of Initiation Method (12 for amount, 11 for no amount)
        id('26', // Merchant Account Information
            id('00', 'br.gov.bcb.pix') +
            id('01', cleanKey) + // CORREÇÃO 1: Usa chave limpa (só números)
            (message ? id('02', message) : '')
        ),
        id('52', '0000'), // Merchant Category Code
        id('53', '986'), // Transaction Currency (BRL)
        // CORREÇÃO 2: Campo 54 (valor) ANTES do campo 58 (BR)
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
