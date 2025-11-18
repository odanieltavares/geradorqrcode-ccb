
import { ResolvedPixProfile, Bank } from '../domain/types';
import { PixData } from '../types';
import { applyMask, formatCnpj } from './masks';

export const mapProfileToPixData = (profile: ResolvedPixProfile, amount?: string): PixData => {
  const { bank, pixKey, regional, congregation, pixPurpose, city } = profile;

  // Format bank fields for display
  const agencyDisplay = applyMask(pixKey.bankAgency, bank.agencyMask);
  const accountDisplay = applyMask(pixKey.bankAccount, bank.accountMask);
  
  // Build a display string for the bank info
  const bankDisplay = `${bank.name} - Ag: ${agencyDisplay} - CC: ${accountDisplay}`;

  // Use owner name from key, or regional name as fallback
  const receiverName = pixKey.ownerName || regional.name;

  return {
    name: receiverName,
    key: formatCnpj(pixKey.cnpj), // Display masked CNPJ
    city: city.name, // Payload city (usually no accents, but handled by lib/pix)
    txid: profile.txid,
    amount: amount || '',
    displayValue: amount ? `R$ ${amount}` : 'R$ ***,00',
    
    // Fields specific to CCB Templates
    location: city.name.toUpperCase(),
    neighborhood: congregation.name.toUpperCase(),
    bank: `${bank.name} - ${bank.code}`,
    agency: agencyDisplay,
    account: accountDisplay,
    message: profile.message,

    // Extra context fields that might be used in newer templates
    regionalName: regional.name.toUpperCase(),
    congregationCode: profile.pixIdentifier.code,
    purposeLabel: pixPurpose.displayLabel,
    bankDisplay: bankDisplay
  };
};

export const resolveProfile = (
  stateId: string, regionalId: string, cityId: string, congregationId: string, purposeId: string,
  domain: any // passing the whole domain store for resolution
): ResolvedPixProfile | null => {
  const state = domain.states.find((s: any) => s.id === stateId);
  const regional = domain.regionals.find((r: any) => r.id === regionalId);
  const city = domain.cities.find((c: any) => c.id === cityId);
  const congregation = domain.congregations.find((c: any) => c.id === congregationId);
  const purpose = domain.purposes.find((p: any) => p.id === purposeId);

  if (!state || !regional || !city || !congregation || !purpose) return null;

  const identifier = domain.identifiers.find((i: any) => i.id === purpose.pixIdentifierId);
  if (!identifier) return null;

  const key = domain.pixKeys.find((k: any) => k.id === identifier.pixKeyId);
  if (!key) return null;

  const bank = domain.banks.find((b: any) => b.id === key.bankId);
  if (!bank) return null;

  // Construct TXID and Message
  // Sanitize TXID base + suffix (remove spaces/special chars, max 25)
  const rawTxid = (identifier.txidBase + purpose.txidSuffix).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const txid = rawTxid.slice(0, 25);

  // Interpolate message
  // This is a simple implementation. Could be expanded with a proper template engine.
  const message = purpose.messageTemplate;

  return {
    state,
    regional,
    city,
    congregation,
    bank,
    pixKey: key,
    pixIdentifier: identifier,
    pixPurpose: purpose,
    txid,
    message
  };
};
