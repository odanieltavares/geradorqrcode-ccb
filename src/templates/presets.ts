import { Template } from '../types';

export const ccbClassicTemplate: Template = {
  id: 'ccb-classic-v1',
  name: 'CCB Clássico',
  version: 1,
  canvas: {
    width: 1240, 
    height: 1648,
    dpi: 300,
    background: '#FFFFFF',
  },
  fonts: [
    { family: 'Inter', weight: 400, style: 'normal' },
    { family: 'Inter', weight: 500, style: 'normal' },
    { family: 'Inter', weight: 600, style: 'normal' },
    { family: 'Inter', weight: 700, style: 'normal' },
  ],
  assets: {
    logo: { 
      source: '{{logo}}', 
      x: 407, 
      y: 110, 
      w: 426, 
      h: 212, 
      fit: 'contain',
      opacity: 1,
    }
  },
  qr: {
    payload: '{{payload}}',
    x: 380,
    y: 598,
    size: 490,
    frame: 'none',
  },
  blocks: [
    { type: 'rule', style: 'dashed', x: 147.75, y: 400, w: 944.5, h: 0, dash: [8, 6] },
    { type: 'text', id: 'scan-prompt', text: 'Leia o QR-CODE para fazer o depósito da coleta', x: 620, y: 454, font: { family: 'Inter', weight: 400, size: 38, style: 'normal' }, align: 'center' },
    { type: 'rule', style: 'dashed', x: 147.75, y: 480, w: 944.5, h: 0, dash: [8, 8] },
    // QR Frame
    { type: 'rule', style: 'solid', x: 340, y: 559, w: 50, h: 4 }, // TL-H
    { type: 'rule', style: 'solid', x: 340, y: 559, w: 4, h: 50 }, // TL-V
    { type: 'rule', style: 'solid', x: 852, y: 559, w: 50, h: 4 }, // TR-H
    { type: 'rule', style: 'solid', x: 900, y: 559, w: 4, h: 50 }, // TR-V
    { type: 'rule', style: 'solid', x: 340, y: 1119, w: 50, h: 4 }, // BL-H
    { type: 'rule', style: 'solid', x: 340, y: 1069, w: 4, h: 50 }, // BL-V
    { type: 'rule', style: 'solid', x: 850, y: 1119, w: 54, h: 4 }, // BR-H
    { type: 'rule', style: 'solid', x: 900, y: 1069, w: 4, h: 50 }, // BR-V
    
    { type: 'text', id: 'qr-identifier', text: 'Identificador: {{txid}}', x: 620, y: 1128, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'center' },
    
    { type: 'rule', style: 'dashed', x: 147.8, y: 1208, w: 944.5, h: 0, dash: [8, 6] },

    { type: 'text', id: 'cents-prompt', text: 'ACRESCENTE OS CENTAVOS COMO\nCÓDIGO IDENTIFICADOR DO PIX:', x: 177.75, y: 1280, font: { family: 'Inter', weight: 500, size: 26, style: 'normal' }, align: 'left' },
    
    { type: 'box', id: 'value-box', x: 698, y: 1240, w: 330, h: 62, fill: '#F5F5F5' },
    { type: 'text', id: 'value-content', text: 'VALOR: [ {{displayValue}} ]', x: 862, y: 1280, font: { family: 'Inter', weight: 700, size: 28, style: 'normal' }, align: 'center' },
    
    { type: 'rule', style: 'dashed', x: 147.8, y: 1340, w: 944.5, h: 0, dash: [8, 6] },
    
    // Left Column Info
    { type: 'text', id: 'details-name', text: '{{name}}', x: 177.75, y: 1394, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'details-location', text: '{{location}} | {{neighborhood}}', x: 177.75, y: 1430.25, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'details-key', text: 'CHAVE PIX CNPJ: {{key}}', x: 177.75, y: 1466.49, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'details-txid', text: '{{finalityOrTxid}}', x: 177.75, y: 1502.74, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    
    // Right Column Info
    { type: 'text', id: 'detail-bank', text: '{{bank}}', x: 697.75, y: 1394, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'detail-agency', text: 'Agência: {{agency}}', x: 697.75, y: 1430.75, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'detail-account', text: 'Conta Corrente: {{account}}', x: 697.75, y: 1466.49, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    
    { type: 'rule', style: 'dashed', x: 147.8, y: 1537.74, w: 944.5, h: 0, dash: [8, 6] },
  ],
  formSchema: [
    { id: 'name', label: 'Nome (recebedor)', type: 'text', required: true, maxLength: 25, normalize: 'upperNoAccent', description: 'Nome que aparecerá no PIX e no cartão.' },
    { id: 'key', label: 'Chave PIX (CNPJ)', type: 'text', required: true, placeholder: '00.000.000/0000-00' },
    { id: 'city', label: 'Cidade (payload)', type: 'text', required: true, maxLength: 15, normalize: 'upperNoAccent', description: 'Cidade para o payload PIX (sem acentos).' },
    { id: 'txid', label: 'Identificador (TXID)', type: 'text', required: true, maxLength: 25, description: 'Identificador único da transação (A-Z, 0-9).', normalize: 'upperNoAccent' },
    { id: 'amount', label: 'Valor (opcional)', type: 'currency', placeholder: '0,00', description: 'Valor a ser codificado no QR Code (não aparece no cartão).' },
    { id: 'displayValue', label: 'Valor (display no cartão)', type: 'text', placeholder: 'R$ ***,00', description: 'Texto do valor que aparece no cartão.' },
    { id: 'location', label: 'Cidade (cartão)', type: 'text', placeholder: 'SAO PAULO', normalize: 'upperNoAccent', description: 'Preenchido com a "Cidade (payload)", mas pode ser editado.' },
    { id: 'neighborhood', label: 'Comum Congregação (Cartão)', type: 'text', placeholder: 'JARDIM BRASILIA', normalize: 'upperNoAccent', description: 'Nome do bairro ou comum congregação para o cartão.' },
    { id: 'bank', label: 'Banco (cartão)', type: 'text', placeholder: 'Banco do Brasil - 001' },
    { id: 'agency', label: 'Agência (cartão)', type: 'text', placeholder: '1117-7' },
    { id: 'account', label: 'Conta (cartão)', type: 'text', placeholder: '41.741-6' },
    { id: 'message', label: 'Mensagem (opcional no Pix)', type: 'text', maxLength: 72, placeholder: 'COLETA OPCIONAL' }
  ],
  bindings: {
    payload: {
      name: '{{name}}',
      key: '{{payloadKey}}', // USES RAW KEY FOR EMV
      city: '{{city}}',
      txid: '{{txid}}',
      amount: '{{amount}}',
      message: '{{message}}',
    },
  },
};

export const minimalTemplate: Template = {
    id: 'minimal-v1',
    name: 'Minimalista',
    version: 1,
    canvas: { width: 800, height: 1000, dpi: 300, background: '#FFFFFF' },
    fonts: [{ family: 'Inter', weight: 400, style: 'normal' }, { family: 'Inter', weight: 700, style: 'normal' }],
    assets: {
      logo: { source: '{{logo}}', x: 300, y: 50, w: 200, h: 100, fit: 'contain' }
    },
    qr: { payload: '{{payload}}', x: 250, y: 200, size: 300, frame: 'square' },
    blocks: [
        { type: 'text', id: 'title', text: 'Pague com PIX', x: 400, y: 180, font: { family: 'Inter', weight: 700, size: 32, style: 'normal' }, align: 'center' },
        { type: 'text', id: 'name', text: '{{name}}', x: 400, y: 550, font: { family: 'Inter', weight: 700, size: 24, style: 'normal' }, align: 'center' },
        { type: 'text', id: 'txid', text: 'ID: {{txid}}', x: 400, y: 580, font: { family: 'Inter', weight: 400, size: 16, style: 'normal' }, align: 'center' },
        { type: 'text', id: 'amount', text: 'Valor: {{displayValue}}', x: 400, y: 620, font: { family: 'Inter', weight: 400, size: 20, style: 'normal' }, align: 'center' },
    ],
    formSchema: [
        { id: 'name', label: 'Nome (recebedor)', type: 'text', required: true, maxLength: 25, normalize: 'upperNoAccent' },
        { id: 'key', label: 'Chave PIX', type: 'text', required: true },
        { id: 'city', label: 'Cidade (payload)', type: 'text', required: true, maxLength: 15, normalize: 'upperNoAccent' },
        { id: 'txid', label: 'Identificador (TXID)', type: 'text', required: true, maxLength: 25, normalize: 'upperNoAccent' },
        { id: 'amount', label: 'Valor (opcional)', type: 'currency' },
        { id: 'displayValue', label: 'Valor (display no cartão)', type: 'text', placeholder: 'R$ 0,00' },
    ],
    bindings: {
        payload: { 
            name: '{{name}}', 
            key: '{{payloadKey}}', // USES RAW KEY FOR EMV
            city: '{{city}}', 
            txid: '{{txid}}', 
            amount: '{{amount}}' 
        },
    },
};


export const allTemplates: Template[] = [
  ccbClassicTemplate,
  minimalTemplate,
];