import { ResolvedPixProfile, PixData, State, Regional, City, Congregation, Bank, PixKey, PixIdentifier, PixPurpose } from '../domain/types';
import { applyMask, formatCnpj } from './masks';

// ... (mapProfileToPixData permanece o mesmo) ...

export const resolveProfile = (
  stateId: string, regionalId: string, cityId: string, congregationId: string, purposeId: string,
  domain: any
): ResolvedPixProfile | null => {
  const state: State = domain.states.find((s: any) => s.id === stateId);
  const regional: Regional = domain.regionals.find((r: any) => r.id === regionalId);
  const city: City = domain.cities.find((c: any) => c.id === cityId);
  const congregation: Congregation = domain.congregations.find((c: any) => c.id === congregationId);
  const purpose: PixPurpose = domain.purposes.find((p: any) => p.id === purposeId);

  if (!state || !regional || !city || !congregation || !purpose) return null;

  // 1. Encontrar o Identificador (TXID Base) via Finalidade
  const identifier: PixIdentifier = domain.identifiers.find((i: any) => i.id === purpose.pixIdentifierId);
  if (!identifier) return null;

  // 2. Encontrar a Chave PIX (CNPJ, Banco)
  let key: PixKey | undefined;

  // Tenta usar a chave PIX vinculada ao Identificador (Chave Específica da Congregação)
  key = domain.pixKeys.find((k: any) => k.id === identifier.pixKeyId);
  
  // SE a chave do Identificador não estiver vinculada à Regional, a lógica do usuário está correta.
  // Vamos buscar a chave principal da Regional que a Congregação está vinculada, se a chave do identificador não for encontrada.
  if (!key) {
      // Caso a chave não esteja diretamente no identificador, busca a chave vinculada à Regional
      key = domain.pixKeys.find((k: any) => k.regionalId === regionalId && k.active);
  }

  if (!key) return null; // Não achou chave PIX

  const bank: Bank = domain.banks.find((b: any) => b.id === key.bankId);
  if (!bank) return null;

  // Construção do TXID (Base + Sufixo) e Sanitização (A-Z, 0-9, max 25)
  const rawTxid = (identifier.txidBase + purpose.txidSuffix).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const txid = rawTxid.slice(0, 25);

  const message = purpose.messageTemplate;

  return {
    state, regional, city, congregation, bank, pixKey: key, pixIdentifier: identifier, pixPurpose: purpose,
    txid, message
  };
};

export const mapProfileToPixData = (profile: ResolvedPixProfile, amount?: string): PixData => {
  const { bank, pixKey, regional, congregation, pixPurpose, city } = profile;

  // Formata campos bancários para EXIBIÇÃO NO CARTÃO usando as máscaras do Banco
  const agencyDisplay = applyMask(pixKey.bankAgency, bank.agencyMask);
  const accountDisplay = applyMask(pixKey.bankAccount, bank.accountMask);
  
  // String completa de dados bancários
  const bankDisplay = `${bank.name} - Ag: ${agencyDisplay} - CC: ${accountDisplay}`;

  // NOME DO RECEBEDOR: Prioridade: Nome na chave -> Nome da Regional
  const receiverName = pixKey.ownerName || regional.name;

  return {
    // Campos padrões do Payload PIX
    name: receiverName,
    key: formatCnpj(pixKey.cnpj), 
    city: city.name, 
    txid: profile.txid,
    amount: amount || '',
    message: profile.message,
    
    // Campos de Display (Cartão)
    displayValue: amount ? `R$ ${amount}` : 'R$ ***,00',
    location: city.name.toUpperCase(),
    neighborhood: congregation.name.toUpperCase(),
    bank: `${bank.name} - ${bank.code}`,
    agency: agencyDisplay,
    account: accountDisplay,
    
    // Campos extras para novos templates
    regionalName: regional.name.toUpperCase(),
    congregationCode: profile.pixIdentifier.code,
    purposeLabel: pixPurpose.displayLabel,
    bankDisplay: bankDisplay
  };
};