import { ResolvedPixProfile } from '../domain/types';
import { PixData } from '../types';
import { applyMask, formatCnpj } from './masks';

export const mapProfileToPixData = (profile: ResolvedPixProfile, amount?: string): PixData => {
  const { bank, regional, congregation, pixPurpose } = profile;

  // Formata campos bancários para EXIBIÇÃO NO CARTÃO usando as máscaras do Banco
  const agencyDisplay = applyMask(regional.bankAgency, bank.agencyMask);
  const accountDisplay = applyMask(regional.bankAccount, bank.accountMask);
  
  // String completa de dados bancários
  const bankDisplay = `${bank.name} - Ag: ${agencyDisplay} - CC: ${accountDisplay}`;

  // NOME DO RECEBEDOR: Nome da Chave (Regional)
  const receiverName = regional.ownerName;
  
  // Valor com Sufixo CCB (Centavos) se não houver valor preenchido
  let finalAmount = amount || '';
  let displayValue = finalAmount ? `R$ ${finalAmount}` : 'R$ ***,00';
  
  if (!finalAmount && congregation.extraCents !== null) {
      // Aplica o sufixo de centavos
      displayValue = `R$ ***,${String(congregation.extraCents).padStart(2, '0')}`;
  }


  return {
    // Campos padrões do Payload PIX
    name: receiverName,
    key: formatCnpj(regional.cnpj), // Exibe CNPJ formatado no input
    city: regional.regionalCityName, // Cidade da Regional, conforme solicitado
    txid: profile.txid,
    amount: finalAmount,
    message: profile.message,
    
    // Campos de Display (Cartão)
    displayValue: displayValue,
    location: profile.city.name.toUpperCase(), // Localização é a Cidade da Congregação
    neighborhood: congregation.name.toUpperCase(),
    bank: `${bank.name} - ${bank.code}`,
    agency: agencyDisplay,
    account: accountDisplay,
    
    // Campos extras para novos templates
    regionalName: regional.name.toUpperCase(),
    congregationCode: `${congregation.shortPrefix}${congregation.ccbSuffix}`, // Ex: JB0059
    purposeLabel: pixPurpose.displayLabel,
    bankDisplay: bankDisplay
  };
};

export const resolveProfile = (
  stateId: string, regionalId: string, cityId: string, congregationId: string, purposeId: string,
  domain: any 
): ResolvedPixProfile | null => {
  const state = domain.states.find((s: any) => s.id === stateId);
  const regional = domain.regionals.find((r: any) => r.id === regionalId);
  const city = domain.cities.find((c: any) => c.id === cityId);
  const congregation = domain.congregations.find((c: any) => c.id === congregationId);
  const purpose = domain.purposes.find((p: any) => p.id === purposeId);

  // Note: Regional e CityId são necessários para o HierarchySelector
  if (!state || !regional || !city || !congregation || !purpose) return null;
  
  // 1. Encontrar o Banco (Dados Financeiros vêm da Regional)
  const bank = domain.banks.find((b: any) => b.id === regional.bankId);
  if (!bank) return null;

  // 2. Construir TXID a partir da Congregação e Finalidade
  // Congregação possui txidBase. Finalidade possui txidSuffix.
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
    txid,
    message
  };
};