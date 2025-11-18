export interface State {
  id: string;
  name: string;          // "Tocantins"
  uf: string;            // "TO"
  ccbStateCode: string;  // "28" (usado em códigos BR-28-XXXX)
}

// Bancos permanecem para as regras de máscara
export interface Bank {
  id: string;            // "001", "341"
  code: string;          // "001", "341"
  name: string;          // "Banco do Brasil", "Itaú"
  agencyMask: string;    // "0000-0"
  accountMask: string;   // "00000-0"
  agencyPattern?: string;
  accountPattern?: string;
}

// REGIONAL (Nova entidade central para Dados Financeiros)
export interface Regional {
  id: string;
  name: string;          // "Regional Porto Nacional"
  stateId: string;       // referencia State.id
  code?: string;         // opcional, ex: "RN-PN"
  // Dados de CNPJ/Banco (Antigo PixKey)
  cnpj: string;          // Somente dígitos
  ownerName: string;     // Nome do titular
  bankId: string;        // referencia Bank.id
  bankAgency: string;    // Somente dígitos
  bankAccount: string;   // Somente dígitos
  regionalCityName: string; // "Porto Nacional" (Nome da cidade para o payload)
  active: boolean;
}

// Cidades (Permanecem, mas serão usadas para filtrar igrejas)
export interface City {
  id: string;
  name: string;          // "Porto Nacional" ou "Luzimangues"
  regionalId: string;    // referencia Regional.id
}

// CONGREGATION (Nova entidade central para Identificação da Transação)
export interface Congregation {
  id: string;
  name: string;              // "Jardim Brasília"
  cityId: string;            // referencia City.id
  regionalId: string;        // Vínculo à Regional (para achar o CNPJ)
  ccbOfficialCode: string;   // "BR-28-0059"
  ccbSuffix: string;         // "0059" (parte final do código)
  shortPrefix: string;       // "JB" (para gerar o identificador JB0059)
  txidBase: string;          // Ex: "BR280059" (Antigo campo do PixIdentifier)
  extraCents: number | null; // opcional, 0–99. Sufixo CCB (ex: 02 para R$ ***,02)
  isCentral: boolean;        
  active: boolean;
}

export interface PixPurpose {
  id: string;
  name: string;             // "Coleta geral"
  displayLabel: string;     // Como aparece no cartão/mensagem
  messageTemplate: string;  // Texto que vai para o campo mensagem/finalidade do PIX
  txidSuffix: string;       // ex: "G01", "F01"
  active: boolean;
}

export interface ResolvedPixProfile {
  state: State;
  regional: Regional;
  city: City;
  congregation: Congregation;
  bank: Bank;
  pixPurpose: PixPurpose;
  
  // Computed fields
  txid: string;          
  message: string;       
}