
export interface State {
  id: string;
  name: string;          // "Tocantins"
  uf: string;            // "TO"
  ccbStateCode: string;  // "28" (usado em códigos BR-28-XXXX)
}

export interface Regional {
  id: string;
  name: string;          // "Regional Porto Nacional"
  stateId: string;       // referencia State.id
  code?: string;         // opcional, ex: "RN-PN"
  defaultPixKeyId?: string; // opcional, referencia PixKey.id
}

export interface City {
  id: string;
  name: string;          // "Porto Nacional"
  regionalId: string;    // referencia Regional.id
}

export interface Congregation {
  id: string;
  name: string;              // "Jardim Brasília"
  cityId: string;            // referencia City.id
  ccbOfficialCode: string;   // "BR-28-0059"
  ccbSuffix: string;         // "0059" (parte final)
  shortPrefix: string;       // "JB" (para gerar JB0059)
  isCentral: boolean;        // true se for "central"
}

export interface Bank {
  id: string;            // pode ser igual ao código, ex: "001"
  code: string;          // "001", "341", etc.
  name: string;          // "Banco do Brasil", "Itaú", etc.
  agencyMask: string;    // "0000-0"
  accountMask: string;   // "00000-0"
  agencyPattern?: string;
  accountPattern?: string;
}

export type PixKeyType = 'CNPJ';

export interface PixKey {
  id: string;
  type: PixKeyType;      
  cnpj: string;          // armazenar somente dígitos (sem máscara)
  ownerName: string;     // Nome do titular que aparece no banco
  bankId: string;        // referencia Bank.id
  bankAgency: string;    // somente dígitos, sem máscara
  bankAccount: string;   // somente dígitos, sem máscara
  regionalId?: string;   // geralmente ligada à Regional
  cityId?: string;       // opcional, casos específicos
  congregationId?: string; // opcional, chave própria de uma igreja
  active: boolean;
}

export type PixIdentifierStrategy = 'TXID_ONLY' | 'CENTS_ONLY' | 'TXID_PLUS_CENTS';

export interface PixIdentifier {
  id: string;
  code: string;          // "JB0059" (identificador humano da igreja)
  congregationId: string;
  pixKeyId: string;      // qual chave PIX esse identificador usa
  txidBase: string;      // ex: "BR280059"
  strategy: PixIdentifierStrategy;
  description?: string;  // "Identificador principal da Comum Jardim Brasília"
  active: boolean;
}

export interface PixPurpose {
  id: string;
  pixIdentifierId: string;  // referencia PixIdentifier.id
  name: string;             // "Coleta geral", "Fundo bíblico", etc.
  shortCode: string;        // "G", "F", "E"...
  displayLabel: string;     // como aparece no cartão: "COLETA GERAL JB0059"
  messageTemplate: string;  // texto que vai para o campo mensagem/finalidade do PIX
  txidSuffix: string;       // ex: "G01", "F01"
  extraCents?: number | null; // opcional, 0–99
  active: boolean;
}

// The resolved object used to populate the form/template
export interface ResolvedPixProfile {
  state: State;
  regional: Regional;
  city: City;
  congregation: Congregation;
  bank: Bank;
  pixKey: PixKey;
  pixIdentifier: PixIdentifier;
  pixPurpose: PixPurpose;
  
  // Computed fields
  txid: string;          
  message: string;       
}
