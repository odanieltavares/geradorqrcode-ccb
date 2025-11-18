export interface PixData {
  [key: string]: string | undefined;
}

export type FormErrors = {
  [key: string]: string;
};

export interface Font {
  family: string;
  weight: string | number;
  style: string;
  size?: number;
}

export interface CanvasConfig {
  width: number;
  height: number;
  dpi: number;
  background?: string;
}

export interface QrConfig {
  payload: string;
  x: number;
  y: number;
  size: number;
  frame: 'none' | 'square' | 'rounded';
}

export interface Asset {
  source: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fit: 'contain' | 'cover';
  opacity?: number;
}

export interface TextBlock {
  type: 'text';
  id: string;
  text: string;
  x: number;
  y: number;
  font: Font;
  align: CanvasTextAlign;
  maxWidth?: number;
}

export interface RuleBlock {
  type: 'rule';
  x: number;
  y: number;
  w: number;
  h: number;
  style: 'solid' | 'dashed';
  dash?: number[];
}

export interface BoxBlock {
  type: 'box';
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface KVBlock {
  type: 'kv';
  id: string;
  x: number;
  y: number;
  rows: string[][];
  labelFont: Font;
  valueFont: Font;
  gapY: number;
}

export type Block = TextBlock | RuleBlock | BoxBlock | KVBlock;

export interface FormSchemaField {
    id: keyof PixData;
    label: string;
    type: 'text' | 'textarea' | 'currency' | 'mask';
    required?: boolean;
    maxLength?: number;
    placeholder?: string;
    pattern?: string;
    mask?: string;
    normalize?: 'upperNoAccent';
    description?: string;
}

export interface Template {
  id: string;
  name: string;
  version: number;
  canvas: CanvasConfig;
  fonts: Font[];
  assets: { [key: string]: Asset };
  qr: QrConfig;
  blocks: Block[];
  formSchema: FormSchemaField[];
  bindings: {
    payload: { [key: string]: string };
    display?: { [key: string]: string };
  };
  print?: {
    bleed?: number;
    margins?: number;
  };
}

export interface TemplateWarning {
  type: 'placeholder';
  key: string;
}

export interface Preset {
  id: string;
  label: string;
  formValues: PixData;
  updatedAt: string;
}
