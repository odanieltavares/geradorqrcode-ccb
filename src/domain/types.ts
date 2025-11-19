
export interface State {
  id: string;
  name: string;          // "Tocantins"
  uf: string;            // "TO"
  ccbStateCode: string;  // "28" (usado em códigos BR-28-XXXX)
}

export interface Bank {
  id: string;            // pode ser igual ao código, ex: "001"
  code: string;          // "001", "341", etc.
  name: string;          // "Banco do Brasil", "Itaú", etc.
  agencyMask: string;    // "0000-0"
  accountMask: string;   // "00000-0"
  agencyPattern?: string; // Regex string opcional
  accountPattern?: string; // Regex string opcional
}

// REGIONAL (Dados Financeiros e Sede Administrativa)
export interface Regional {
  id: string;
  name: string;          // "Regional Porto Nacional"
  stateId: string;       // referencia State.id
  code?: string;         // opcional, ex: "RN-PN"
  active: boolean;
  
  // Dados de CNPJ/Banco
  cnpj: string;          // Somente dígitos
  ownerName: string;     // Nome do titular
  bankId: string;        // referencia Bank.id
  bankAgency: string;    // Somente dígitos
  bankAccount: string;   // Somente dígitos
  regionalCityName: string; // "Porto Nacional" (Nome da cidade para o payload)
}

export interface City {
  id: string;
  name: string;          // "Porto Nacional"
  regionalId: string;    // referencia Regional.id
}

// CONGREGATION (Identificação da Transação)
export interface Congregation {
  id: string;
  name: string;              // "Jardim Brasília"
  cityId: string;            // referencia City.id
  regionalId: string;        // Vínculo direto à Regional
  
  ccbOfficialCode: string;   // "BR-28-0059"
  ccbSuffix: string;         // "0059" (parte final)
  shortPrefix: string;       // "JB" (para gerar JB0059)
  isCentral: boolean;        // true se for "central"
  
  txidBase: string;          // ex: "BR280059"
  extraCents: number | null;
  active: boolean;
}

export interface PixPurpose {
  id: string;
  name: string;             // "Coleta geral", "Fundo bíblico"
  displayLabel: string;     // como aparece no cartão: "COLETA GERAL JB0059"
  messageTemplate: string;  // texto que vai para o campo mensagem do PIX
  txidSuffix: string;       // ex: "G01", "F01"
  active: boolean;
}

// Objeto resolvido pronto para preencher o template/gerador
export interface ResolvedPixProfile {
  state: State;
  regional: Regional;
  city: City;
  congregation: Congregation;
  bank: Bank;
  pixPurpose: PixPurpose;
  
  // Campos computados
  txid: string;          
  message: string;       
}
