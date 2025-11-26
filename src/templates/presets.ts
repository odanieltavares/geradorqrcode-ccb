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
      key: '{{key}}', // Chave PIX (CNPJ ou similar)
      city: '{{city}}',
      txid: '{{txid}}',
      amount: '{{amount}}',
      message: '{{message}}',
    },
  },
};

// CORREÇÃO BUG #10: Template Minimalista redesenhado baseado na imagem fornecida
export const minimalTemplate: Template = {
  id: 'minimal-v2',
  name: 'Minimalista',
  version: 2,
  canvas: {
    width: 1240,
    height: 1750,
    dpi: 300,
    background: '#FFFFFF'
  },
  fonts: [
    { family: 'Inter', weight: 400, style: 'normal' },
    { family: 'Inter', weight: 700, style: 'normal' }
  ],
  assets: {
    logo: {
      source: '{{logo}}',
      x: 420,
      y: 80,
      w: 400,
      h: 120,
      fit: 'contain'
    }
  },
  qr: {
    payload: '{{payload}}',
    x: 770,
    y: 350,
    size: 500,
    frame: 'none'
  },
  blocks: [
    // Borda externa pontilhada
    { type: 'rule', style: 'dashed', x: 80, y: 80, w: 1080, h: 4, dash: [12, 8] },
    { type: 'rule', style: 'dashed', x: 80, y: 80, w: 4, h: 1590, dash: [12, 8] },
    { type: 'rule', style: 'dashed', x: 80, y: 1666, w: 1080, h: 4, dash: [12, 8] },
    { type: 'rule', style: 'dashed', x: 1156, y: 80, w: 4, h: 1590, dash: [12, 8] },

    // Seção superior - Logo e título
    { type: 'text', id: 'church-name', text: 'CONGREGAÇÃO CRISTÃ\\nNO BRASIL', x: 620, y: 260, font: { family: 'Inter', weight: 700, size: 42, style: 'normal' }, align: 'center' },

    // Linha separadora após logo
    { type: 'rule', style: 'dashed', x: 150, y: 300, w: 940, h: 2, dash: [10, 6] },

    // Coluna Esquerda - Dados da igreja
    { type: 'text', id: 'church-location', text: 'IGREJA | {{location}}', x: 150, y: 380, font: { family: 'Inter', weight: 700, size: 28, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'admin-note', text: 'EM CASO DE DÚVIDAS PROCURAR\\nA ADMINISTRAÇÃO', x: 150, y: 480, font: { family: 'Inter', weight: 400, size: 22, style: 'normal' }, align: 'left' },

    // Coluna Direita - QR Code
    { type: 'text', id: 'qr-instruction', text: 'Leia o QR-CODE para\\nenviar o pix da coleta', x: 960, y: 280, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'center', maxWidth: 380 },

    // Moldura vermelha ao redor do QR
    { type: 'box', x: 758, y: 338, w: 404, h: 404, stroke: '#CC0000', strokeWidth: 6, fill: 'transparent' },

    // Linha separadora antes da seção inferior
    { type: 'rule', style: 'dashed', x: 150, y: 820, w: 940, h: 2, dash: [10, 6] },

    // Seção inferior - Instruções
    { type: 'text', id: 'instruction', text: 'ACRESCENTE OS CENTAVOS COMO\\nCÓDIGO IDENTIFICADOR DO PIX:', x: 150, y: 900, font: { family: 'Inter', weight: 700, size: 28, style: 'normal' }, align: 'left' },

    // Valor em destaque
    { type: 'text', id: 'value-display', text: 'VALOR: [ {{displayValue}} ]', x: 960, y: 900, font: { family: 'Inter', weight: 700, size: 32, style: 'normal' }, align: 'center' },

    // Linha separadora
    { type: 'rule', style: 'dashed', x: 150, y: 980, w: 940, h: 2, dash: [10, 6] },

    // Dados PIX - Coluna Esquerda
    { type: 'text', id: 'pix-name', text: '{{name}}', x: 150, y: 1060, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'pix-key', text: 'CHAVE PIX CNPJ: {{key}}', x: 150, y: 1110, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'pix-regional', text: 'REGIONAL: {{regionalName}}', x: 150, y: 1160, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'pix-purpose', text: 'FINALIDADE: {{purposeLabel}}', x: 150, y: 1210, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },

    // Dados Bancários - Coluna Direita
    { type: 'text', id: 'bank-info', text: '{{bank}}', x: 730, y: 1060, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'agency-info', text: 'Agência: {{agency}}', x: 730, y: 1110, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'account-info', text: 'Conta Corrente: {{account}}', x: 730, y: 1160, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },
    { type: 'text', id: 'identifier-info', text: 'Identificador: {{txid}}', x: 730, y: 1210, font: { family: 'Inter', weight: 400, size: 24, style: 'normal' }, align: 'left' },

    // Linha separadora final
    { type: 'rule', style: 'dashed', x: 150, y: 1280, w: 940, h: 2, dash: [10, 6] },
  ],
  formSchema: [
    { id: 'name', label: 'Nome (recebedor)', type: 'text', required: true, maxLength: 25, normalize: 'upperNoAccent' },
    { id: 'key', label: 'Chave PIX (CNPJ)', type: 'text', required: true },
    { id: 'city', label: 'Cidade (payload)', type: 'text', required: true, maxLength: 15, normalize: 'upperNoAccent' },
    { id: 'location', label: 'Localização da Igreja', type: 'text', placeholder: 'JARDIM BRASÍLIA', normalize: 'upperNoAccent' },
    { id: 'regionalName', label: 'Nome da Regional', type: 'text', placeholder: 'PORTO NACIONAL' },
    { id: 'txid', label: 'Identificador (TXID)', type: 'text', required: true, maxLength: 25, normalize: 'upperNoAccent' },
    { id: 'amount', label: 'Valor (opcional)', type: 'currency' },
    { id: 'displayValue', label: 'Valor (display no cartão)', type: 'text', placeholder: 'R$ ***,02' },
    { id: 'purposeLabel', label: 'Finalidade', type: 'text', placeholder: 'COLETA GERAL' },
    { id: 'bank', label: 'Banco', type: 'text', placeholder: 'Banco do Brasil - 001' },
    { id: 'agency', label: 'Agência', type: 'text', placeholder: '1117-7' },
    { id: 'account', label: 'Conta Corrente', type: 'text', placeholder: '41.741-6' },
  ],
  bindings: {
    payload: {
      name: '{{name}}',
      key: '{{key}}',
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