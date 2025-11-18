import { ResolvedPixProfile, PixData, State, Regional, City, Congregation, Bank, PixKey, PixIdentifier, PixPurpose } from '../domain/types';
import { applyMask, formatCnpj } from './masks';

// ... (mapProfileToPixData permanece o mesmo) ...

export const resolveProfile = (
  stateId: string, regionalId: string, cityId: string, congregationId: string, purposeId: string,
  domain: any 
): ResolvedPixProfile | null => {
  const state = domain.states.find((s: any) => s.id === stateId);
  const regional = domain.regionals.find((r: any) => r.id === regionalId);
  const city = domain.cities.find((c: any) => c.id === cityId);
  const congregation = domain.congregations.find((c: any) => c.id === congregationId);
  const purpose = domain.purposes.find((p: any) => p.id === purposeId);

  // Note: Regional e CityId são necessários para o HierarchySelector funcionar corretamente
  if (!state || !regional || !city || !congregation || !purpose) return null;

  // 1. Encontrar o Banco/CNPJ via Regional
  const bank = domain.banks.find((b: any) => b.id === regional.bankId);
  if (!bank) return null;

  // 2. Construir TXID a partir da Congregação e Finalidade
  // Adiciona o sufixo de centavos (extraCents) ao valor se a estratégia for CENTS_ONLY (não implementada, mas o campo está presente)
  
  // Sanitize TXID base + suffix (remove espaços/caracteres especiais, max 25)
  const rawTxid = (congregation.txidBase + purpose.txidSuffix).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const txid = rawTxid.slice(0, 25);

  // A Mensagem é unificada: Label no Cartão = Mensagem no Payload
  const message = purpose.displayLabel;

  return {
    state,
    regional,
    city,
    congregation,
    bank,
    pixPurpose: purpose,
    // Note: Não há mais pixKey, usamos regional diretamente.
    txid,
    message
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