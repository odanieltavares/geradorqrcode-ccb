import { State, Regional, City, Congregation, Bank, PixKey, PixIdentifier, PixPurpose } from './types';

export const initialBanks: Bank[] = [
  { id: '001', code: '001', name: 'Banco do Brasil', agencyMask: '0000-0', accountMask: '00.000-0' },
  { id: '341', code: '341', name: 'Itaú', agencyMask: '0000', accountMask: '00000-0' },
  { id: '104', code: '104', name: 'Caixa Econômica', agencyMask: '0000', accountMask: '000.000.000-0' },
  { id: '033', code: '033', name: 'Santander', agencyMask: '0000', accountMask: '00.000000.0' },
  { id: '237', code: '237', name: 'Bradesco', agencyMask: '0000', accountMask: '0000000-0' },
  { id: '260', code: '260', name: 'Nu Pagamentos', agencyMask: '0000', accountMask: '00000000-0' },
  { id: '077', code: '077', name: 'Inter', agencyMask: '0000', accountMask: '0000000-0' },
];

export const initialStates: State[] = [
  { id: 'sp', name: 'São Paulo', uf: 'SP', ccbStateCode: '10' },
  { id: 'to', name: 'Tocantins', uf: 'TO', ccbStateCode: '28' },
];

export const initialRegionals: Regional[] = [
  { id: 'reg-sp-capital', name: 'Capital SP', stateId: 'sp', code: 'SP-CAP' },
  { id: 'reg-porto', name: 'Regional Porto Nacional', stateId: 'to', code: 'RN-PN' },
];

export const initialCities: City[] = [
  { id: 'sao-paulo', name: 'São Paulo', regionalId: 'reg-sp-capital' },
  { id: 'porto-nacional', name: 'Porto Nacional', regionalId: 'reg-porto' },
];

export const initialCongregations: Congregation[] = [
  { id: 'bras', name: 'Brás', cityId: 'sao-paulo', ccbOfficialCode: 'BR-10-0001', ccbSuffix: '0001', shortPrefix: 'BS', isCentral: true },
  { id: 'jardim-brasilia', name: 'Jardim Brasília', cityId: 'porto-nacional', ccbOfficialCode: 'BR-28-0059', ccbSuffix: '0059', shortPrefix: 'JB', isCentral: false },
];

// Chaves PIX vinculadas a regionais
export const initialPixKeys: PixKey[] = [
  { 
    id: 'key-1', type: 'CNPJ', cnpj: '03493231000140', ownerName: 'CONGREGACAO CRISTA NO BRASIL', 
    bankId: '001', bankAgency: '11177', bankAccount: '417416', regionalId: 'reg-sp-capital', active: true 
  },
  { 
    id: 'key-2', type: 'CNPJ', cnpj: '12345678000199', ownerName: 'CCB REGIONAL PORTO', 
    bankId: '341', bankAgency: '1234', bankAccount: '123456', regionalId: 'reg-porto', active: true 
  },
];

export const initialIdentifiers: PixIdentifier[] = [
  { 
    id: 'id-jb', code: 'JB0059', congregationId: 'jardim-brasilia', pixKeyId: 'key-2', 
    txidBase: 'BR280059', strategy: 'TXID_ONLY', active: true 
  },
  { 
    id: 'id-bras', code: 'BRAS', congregationId: 'bras', pixKeyId: 'key-1', 
    txidBase: 'BR100001', strategy: 'TXID_ONLY', active: true 
  }
];

export const initialPurposes: PixPurpose[] = [
  { 
    id: 'purp-jb-geral', pixIdentifierId: 'id-jb', name: 'Coleta Geral', 
    displayLabel: 'COLETA GERAL JB0059', messageTemplate: 'COLETA GERAL JB0059', txidSuffix: 'G01', active: true 
  },
  { 
    id: 'purp-jb-const', pixIdentifierId: 'id-jb', name: 'Construção', 
    displayLabel: 'CONSTRUCAO JB0059', messageTemplate: 'CONSTRUCAO JB0059', txidSuffix: 'C01', active: true 
  },
   { 
    id: 'purp-bras-geral', pixIdentifierId: 'id-bras', name: 'Coleta Geral', 
    displayLabel: 'COLETA GERAL BRAS', messageTemplate: 'COLETA GERAL BRAS', txidSuffix: 'G01', active: true 
  }
];