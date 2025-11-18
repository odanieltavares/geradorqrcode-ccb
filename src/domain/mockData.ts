import { State, Regional, City, Congregation, Bank, PixPurpose } from './types';

export const initialBanks: Bank[] = [
  { id: '001', code: '001', name: 'Banco do Brasil', agencyMask: '0000-0', accountMask: '00.000-0' },
  { id: '341', code: '341', name: 'Itaú', agencyMask: '0000', accountMask: '00000-0' },
  { id: '104', code: '104', name: 'Caixa Econômica', agencyMask: '0000', accountMask: '000.00000000-0' },
];

export const initialStates: State[] = [
  { id: 'sp', name: 'São Paulo', uf: 'SP', ccbStateCode: '10' },
  { id: 'to', name: 'Tocantins', uf: 'TO', ccbStateCode: '28' },
];

export const initialRegionals: Regional[] = [
  { 
    id: 'reg-sp-capital', name: 'Capital SP', stateId: 'sp', code: 'SP-CAP', active: true,
    cnpj: '03493231000140', ownerName: 'CONGREGACAO CRISTA NO BRASIL', 
    bankId: '001', bankAgency: '11177', bankAccount: '417416', regionalCityName: 'SAO PAULO' 
  },
  { 
    id: 'reg-porto', name: 'Regional Porto Nacional', stateId: 'to', code: 'RN-PN', active: true,
    cnpj: '00000000000100', ownerName: 'CCB REGIONAL PORTO', 
    bankId: '341', bankAgency: '1234', bankAccount: '123456', regionalCityName: 'PORTO NACIONAL'
  },
];

export const initialCities: City[] = [
  { id: 'sao-paulo', name: 'São Paulo', regionalId: 'reg-sp-capital' },
  { id: 'porto-nacional', name: 'Porto Nacional', regionalId: 'reg-porto' },
  { id: 'luzimangues', name: 'Luzimangues', regionalId: 'reg-porto' },
];

export const initialCongregations: Congregation[] = [
  { 
    id: 'bras', name: 'Brás', cityId: 'sao-paulo', regionalId: 'reg-sp-capital',
    ccbOfficialCode: 'BR-10-0001', ccbSuffix: '0001', shortPrefix: 'BS', isCentral: true,
    txidBase: 'BR100001', extraCents: 0, active: true
  },
  { 
    id: 'jardim-brasilia', name: 'Jardim Brasília', cityId: 'porto-nacional', regionalId: 'reg-porto', 
    ccbOfficialCode: 'BR-28-0059', ccbSuffix: '0059', shortPrefix: 'JB', isCentral: false,
    txidBase: 'BR280059', extraCents: 59, active: true // Exemplo de sufixo 59
  },
   { 
    id: 'luzimangues-jv', name: 'Loteamento Jardim Veneza', cityId: 'luzimangues', regionalId: 'reg-porto', 
    ccbOfficialCode: 'BR-28-0322', ccbSuffix: '0322', shortPrefix: 'LZM', isCentral: false,
    txidBase: 'BR280322', extraCents: 22, active: true
  },
];

export const initialPurposes: PixPurpose[] = [
  { 
    id: 'purp-geral', name: 'Coleta Geral', 
    displayLabel: 'COLETA GERAL', messageTemplate: 'COLETA GERAL', txidSuffix: 'G01', active: true 
  },
  { 
    id: 'purp-const', name: 'Fundo Bíblico/Construção', 
    displayLabel: 'FUNDO BIBLICO', messageTemplate: 'FUNDO BIBLICO', txidSuffix: 'F01', active: true 
  },
];