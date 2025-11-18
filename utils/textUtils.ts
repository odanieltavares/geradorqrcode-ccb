import { PixData, FormSchemaField } from "../types";
import { formatCurrency, unformatCurrency } from '../lib/pix';

// A simple function to strip accents from a string
export const stripAccents = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// A generic text placeholder replacer
export const replacePlaceholders = (text: string, data: PixData): string => {
    if (!text) return '';
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key as keyof PixData] || '';
    });
};

export const normalizeValue = (value: string, fieldSchema?: FormSchemaField): string => {
  if (!fieldSchema) return value;
  
  if (fieldSchema.type === 'currency') {
    return unformatCurrency(value);
  }
  
  if (fieldSchema.id === 'displayValue') {
      const digits = value.replace(/\D/g, '');
      return digits ? `R$ ***,${digits}` : '';
  }

  let processedValue = value;

  if (fieldSchema.normalize === 'upperNoAccent') {
    processedValue = stripAccents(processedValue).toUpperCase();
  }
  
  if (fieldSchema.id === 'txid') {
      processedValue = processedValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  if (fieldSchema.maxLength) {
    processedValue = processedValue.slice(0, fieldSchema.maxLength);
  }
  
  return processedValue;
};

export const formatValue = (value: string, fieldSchema?: FormSchemaField): string => {
    if (!fieldSchema) return value;
    if (fieldSchema.type === 'currency') {
        return formatCurrency(value);
    }
    return value;
};