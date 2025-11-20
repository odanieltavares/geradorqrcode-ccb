// ============================================================================
// TIPOS PRINCIPAIS DO SISTEMA
// ============================================================================
// Este arquivo centraliza todos os tipos usados no sistema de geração de QR Codes PIX

// Re-exporta tipos do domínio para facilitar imports
export type {
    State,
    Bank,
    Regional,
    City,
    Congregation,
    PixPurpose,
    ResolvedPixProfile
} from './domain/types';

// ============================================================================
// TIPOS DE DADOS PIX
// ============================================================================

/**
 * Dados do PIX para geração de payload e exibição no cartão
 */
export interface PixData {
    // Campos obrigatórios do payload PIX EMV
    name?: string;              // Nome do recebedor (25 chars max, sem acentos)
    key?: string;               // Chave PIX (CNPJ, telefone, email, etc)
    city?: string;              // Cidade para o payload (15 chars max, sem acentos)
    txid?: string;              // Identificador da transação (25 chars max, A-Z 0-9)
    amount?: string;            // Valor em formato decimal "10.00"
    message?: string;           // Mensagem/finalidade (72 chars max)

    // Campos de exibição no cartão
    displayValue?: string;      // Valor formatado para exibição "R$ ***,00"
    location?: string;          // Localização (cidade da congregação)
    neighborhood?: string;      // Bairro/Comum da congregação
    bank?: string;              // Nome do banco
    agency?: string;            // Agência formatada
    account?: string;           // Conta formatada

    // Campos extras para templates avançados
    regionalName?: string;      // Nome da regional
    congregationCode?: string;  // Código da igreja (ex: JB0059)
    purposeLabel?: string;      // Label da finalidade
    bankDisplay?: string;       // String completa de dados bancários

    // Permite campos dinâmicos para placeholders customizados
    [key: string]: string | undefined;
}

/**
 * Erros de validação do formulário
 */
export interface FormErrors {
    [key: string]: string;
}

/**
 * Avisos do template (campos faltantes, etc)
 */
export interface TemplateWarning {
    type: 'placeholder' | 'validation' | 'info';
    key?: string;
    message?: string;
}

// ============================================================================
// TIPOS DE TEMPLATE
// ============================================================================

/**
 * Configuração do canvas
 */
export interface CanvasConfig {
    width: number;              // Largura em pixels
    height: number;             // Altura em pixels
    dpi: number;                // DPI para impressão (geralmente 300)
    background: string;         // Cor de fundo (hex ou rgb)
}

/**
 * Configuração de fonte
 */
export interface Font {
    family: string;             // Nome da fonte (ex: "Inter")
    weight: number;             // Peso (400, 500, 600, 700)
    style: string;              // Estilo ("normal", "italic")
    size?: number;              // Tamanho (usado em alguns contextos)
}

/**
 * Asset (imagem, logo, etc)
 */
export interface Asset {
    source: string;             // URL ou placeholder (ex: "{{logo}}")
    x: number;                  // Posição X
    y: number;                  // Posição Y
    w: number;                  // Largura
    h: number;                  // Altura
    fit?: 'contain' | 'cover'; // Modo de ajuste
    opacity?: number;           // Opacidade (0-1)
}

/**
 * Configuração do QR Code
 */
export interface QrConfig {
    payload: string;            // Placeholder do payload (ex: "{{payload}}")
    x: number;                  // Posição X
    y: number;                  // Posição Y
    size: number;               // Tamanho do QR Code
    frame?: 'none' | 'square' | 'round'; // Tipo de moldura
}

/**
 * Bloco de texto
 */
export interface TextBlock {
    type: 'text';
    id: string;                 // Identificador único
    text: string;               // Texto com placeholders
    x: number;                  // Posição X
    y: number;                  // Posição Y
    font: Font;                 // Configuração da fonte
    align: 'left' | 'center' | 'right'; // Alinhamento
    maxWidth?: number;          // Largura máxima
}

/**
 * Bloco de linha/régua
 */
export interface RuleBlock {
    type: 'rule';
    id?: string;
    style: 'solid' | 'dashed';
    x: number;
    y: number;
    w: number;                  // Largura da linha
    h: number;                  // Espessura da linha
    dash?: number[];            // Padrão de tracejado [on, off]
}

/**
 * Bloco de caixa/retângulo
 */
export interface BoxBlock {
    type: 'box';
    id?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    fill?: string;              // Cor de preenchimento
    stroke?: string;            // Cor da borda
    strokeWidth?: number;       // Espessura da borda
}

/**
 * Bloco de pares chave-valor
 */
export interface KvBlock {
    type: 'kv';
    id?: string;
    x: number;
    y: number;
    rows: [string, string][];   // Array de [label, value]
    gapY: number;               // Espaçamento vertical entre linhas
    labelFont: Font;
    valueFont: Font;
}

/**
 * União de todos os tipos de blocos
 */
export type Block = TextBlock | RuleBlock | BoxBlock | KvBlock;

/**
 * Campo do formulário (schema)
 */
export interface FormSchemaField {
    id: string;                 // ID do campo
    label: string;              // Label exibido
    type: 'text' | 'currency' | 'number';
    required?: boolean;
    placeholder?: string;
    maxLength?: number;
    normalize?: 'upperNoAccent' | 'upper' | 'lower';
    description?: string;
}

/**
 * Template completo de cartão
 */
export interface Template {
    id: string;                 // ID único do template
    name: string;               // Nome exibido
    version: number;            // Versão do template
    canvas: CanvasConfig;       // Configuração do canvas
    fonts: Font[];              // Fontes necessárias
    assets: { [key: string]: Asset }; // Assets (logo, imagens)
    qr: QrConfig;               // Configuração do QR Code
    blocks: Block[];            // Blocos visuais (textos, linhas, etc)
    formSchema?: FormSchemaField[]; // Schema do formulário
    bindings?: {                // Mapeamento de dados
        payload: { [key: string]: string };
    };
}
