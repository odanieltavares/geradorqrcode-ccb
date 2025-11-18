
// Remove non-numeric characters
export const stripNonNumeric = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Format: 00.000.000/0001-00
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

// Apply a generic mask like "0000-0" or "000.000-0"
// '#' or '0' in the mask represents a digit slot.
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

// Simple validation based on length for MVP
export const isValidCnpj = (cnpj: string): boolean => {
  const digits = stripNonNumeric(cnpj);
  return digits.length === 14;
};
