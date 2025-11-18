// Remove caracteres não numéricos
export const stripNonNumeric = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Formata CNPJ: 00.000.000/0001-00
export const formatCnpj = (value: string): string => {
  const digits = stripNonNumeric(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const unformatCnpj = (value: string): string => {
  return stripNonNumeric(value);
};

// Aplica uma máscara genérica onde '0' ou '#' são placeholders de dígitos
// Ex: mask "0000-0", value "12345" -> "1234-5"
export const applyMask = (value: string, mask: string): string => {
  const digits = stripNonNumeric(value);
  let result = '';
  let digitIndex = 0;

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    const maskChar = mask[i];
    if (maskChar === '0' || maskChar === '#') {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += maskChar;
    }
  }
  return result;
};

export const stripMask = (value: string): string => {
  return stripNonNumeric(value);
};

export const isValidCnpj = (cnpj: string): boolean => {
  const digits = stripNonNumeric(cnpj);
  // Validação simples de comprimento para MVP. 
  // Em produção, adicionar algoritmo de dígitos verificadores.
  return digits.length === 14;
};