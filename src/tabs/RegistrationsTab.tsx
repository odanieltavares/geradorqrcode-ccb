import React, { useState } from 'react';
import { useDomain } from '../context/DomainContext';
import { Regional, Congregation, PixPurpose } from '../domain/types';
import { Plus, Trash2 } from 'lucide-react';
import TextField from '../components/TextField';
import { v4 as uuidv4 } from 'uuid';
import { formatCnpj, unformatCnpj, applyMask, stripNonNumeric } from '../utils/masks';

// --- Admin Tab Component ---
const AdminTab: React.FC = () => {
  const domain = useDomain();
  // Mantendo apenas as abas solicitadas
  const [activeSection, setActiveSection] = useState<string>('regionals'); 

  // --- Funções de Update Genéricas ---
  const createUpdater = <T extends { id: string }>(setter: (v: T[]) => void, items: T[]) => 
    (id: string, field: keyof T, value: any) => {
        setter(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

  const updateRegional = createUpdater<Regional>(domain.setRegionals, domain.regionals);
  const updateCongregation = createUpdater<Congregation>(domain.setCongregations, domain.congregations);
  const updatePurpose = createUpdater<PixPurpose>(domain.setPurposes, domain.purposes);

  // --- Renderização de Regionais (Agora com Dados Bancários) ---
  const renderRegionals = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Regionais (Centro Financeiro e Chave PIX)</h3>
        <button onClick={() => {
            if(domain.states.length === 0 || domain.banks.length === 0) return alert('Cadastre Bancos e Estados primeiro.');
            const defaultBankId = domain.banks[0].id;
            const defaultStateId = domain.states[0].id;

            const newItem: Regional = {
                id: uuidv4(), name: 'Nova Regional', stateId: defaultStateId, active: true,
                cnpj: '00000000000100', ownerName: 'Novo Titular CCB', bankId: defaultBankId,
                bankAgency: '0000', bankAccount: '00000', regionalCityName: 'CIDADE'
            };
            domain.setRegionals([...domain.regionals, newItem]);
        }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2">
          <Plus size={16}/> Nova Regional
        </button>
      </div>
      
      {domain.regionals.map(regional => {
        const bank = domain.banks.find(b => b.id === regional.bankId);
        const state = domain.states.find(s => s.id === regional.stateId);
        
        return (
          <div key={regional.id} className="border rounded p-4 space-y-3 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TextField label="Nome da Regional" value={regional.name} onChange={e => updateRegional(regional.id, 'name', e.target.value)} />
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={regional.stateId} onChange={e => updateRegional(regional.id, 'stateId', e.target.value)}>
                  {domain.states.map(s => <option key={s.id} value={s.id}>{s.name} ({s.uf})</option>)}
                </select>
              </div>
              <TextField label="Cidade da Sede (Payload)" value={regional.regionalCityName} onChange={e => updateRegional(regional.id, 'regionalCityName', e.target.value)} />
              <TextField label="Cód. Opcional" value={regional.code || ''} onChange={e => updateRegional(regional.id, 'code', e.target.value)} />
            </div>
            
            <div className="pt-4 border-t mt-4">
                <h4 className="text-sm font-semibold mb-3 text-primary">Dados Financeiros (Chave PIX)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TextField label="Nome do Titular" value={regional.ownerName} onChange={e => updateRegional(regional.id, 'ownerName', e.target.value)} />
                    <TextField label="CNPJ" value={formatCnpj(regional.cnpj)} onChange={e => updateRegional(regional.id, 'cnpj', unformatCnpj(e.target.value))} placeholder="00.000.000/0000-00" />
                    <div>
                        <label className="block text-sm font-medium mb-1">Banco</label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={regional.bankId} onChange={e => updateRegional(regional.id, 'bankId', e.target.value)}>
                            {domain.banks.map(b => <option key={b.id} value={b.id}>{b.code} - {b.name}</option>)}
                        </select>
                    </div>
                    <TextField label={`Agência (${bank?.agencyMask || ''})`} value={applyMask(regional.bankAgency, bank?.agencyMask || '')} onChange={e => updateRegional(regional.id, 'bankAgency', stripNonNumeric(e.target.value))} />
                    <TextField label={`Conta (${bank?.accountMask || ''})`} value={applyMask(regional.bankAccount, bank?.accountMask || '')} onChange={e => updateRegional(regional.id, 'bankAccount', stripNonNumeric(e.target.value))} />
                </div>
            </div>

            <div className="flex justify-end mt-4">
               <button onClick={() => domain.setRegionals(domain.regionals.filter(k => k.id !== regional.id))} className="text-destructive text-sm flex items-center gap-1 hover:underline">
                 <Trash2 size={14}/> Remover Regional
               </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- Renderização de Igrejas (Com Novo Vínculo e Identificadores) ---
  const renderCongregations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Igrejas / Congregações (Identificador da Transação)</h3>
         <button onClick={() => {
            if(domain.regionals.length === 0 || domain.cities.length === 0) return alert('Cadastre Regional e Cidade primeiro.');
            const defaultRegionalId = domain.regionals[0].id;
            const defaultCityId = domain.cities.find(c => c.regionalId === defaultRegionalId)?.id || domain.cities[0].id;
            domain.setCongregations([...domain.congregations, { 
                id: uuidv4(), name: 'Nova Igreja', cityId: defaultCityId, regionalId: defaultRegionalId, 
                ccbOfficialCode: 'BR-XX-XXXX', ccbSuffix: 'XXXX', shortPrefix: 'NOVA', isCentral: false, 
                txidBase: 'BRXXXXXX', extraCents: 0, active: true
            }]); 
          }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2">
          <Plus size={16}/> Nova Igreja
        </button>
      </div>
      
      {domain.congregations.map(congregation => {
        const regional = domain.regionals.find(r => r.id === congregation.regionalId);
        const citiesFilteredByRegional = domain.cities.filter(c => c.regionalId === congregation.regionalId);
        
        return (
          <div key={congregation.id} className="border rounded p-4 space-y-3 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TextField label="Nome da Igreja" value={congregation.name} onChange={e => updateCongregation(congregation.id, 'name', e.target.value)} />
              <TextField label="Prefixo Curto (JB)" value={congregation.shortPrefix} onChange={e => updateCongregation(congregation.id, 'shortPrefix', e.target.value)} />
              <TextField label="Sufixo (0059)" value={congregation.ccbSuffix} onChange={e => updateCongregation(congregation.id, 'ccbSuffix', e.target.value)} />
              <TextField label="Código Oficial (BR-28-0059)" value={congregation.ccbOfficialCode} onChange={e => updateCongregation(congregation.id, 'ccbOfficialCode', e.target.value)} />
              <TextField label="TXID Base (BR280059)" value={congregation.txidBase} onChange={e => updateCongregation(congregation.id, 'txidBase', e.target.value)} />
              <TextField label="Sufixo CCB (Centavos)" value={String(congregation.extraCents || 0)} onChange={e => updateCongregation(congregation.id, 'extraCents', Number(e.target.value))} />
            </div>

            <div className="pt-4 border-t mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Regional (Doador do CNPJ)</label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={congregation.regionalId} onChange={e => { updateCongregation(congregation.id, 'regionalId', e.target.value); updateCongregation(congregation.id, 'cityId', citiesFilteredByRegional[0]?.id || ''); }}>
                       {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name} ({r.regionalCityName})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Cidade (Localização)</label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={congregation.cityId} onChange={e => updateCongregation(congregation.id, 'cityId', e.target.value)} disabled={citiesFilteredByRegional.length === 0}>
                       {citiesFilteredByRegional.length === 0 && <option value="" disabled>Nenhuma cidade na Regional</option>}
                       {citiesFilteredByRegional.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex justify-end mt-4">
               <button onClick={() => domain.setCongregations(domain.congregations.filter(k => k.id !== congregation.id))} className="text-destructive text-sm flex items-center gap-1 hover:underline">
                 <Trash2 size={14}/> Remover Igreja
               </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- Renderização de Finalidades (Mensagem Unificada) ---
  const renderPurposes = () => (
     <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Finalidades / Mensagens (Coletas)</h3>
        <button onClick={() => {
            domain.setPurposes([...domain.purposes, { id: uuidv4(), name: 'Nova Coleta', displayLabel: 'NOVA COLETA', messageTemplate: 'NOVA COLETA', txidSuffix: 'N01', active: true }]);
        }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2">
          <Plus size={16}/> Nova Finalidade
        </button>
      </div>
      
      {domain.purposes.map(purpose => (
        <div key={purpose.id} className="border rounded p-4 space-y-3 bg-card">
          <TextField label="Nome Interno" value={purpose.name} onChange={e => updatePurpose(purpose.id, 'name', e.target.value)} />
          <TextField 
            label="Label no Cartão / Mensagem no Payload" 
            value={purpose.displayLabel} 
            onChange={e => {
                updatePurpose(purpose.id, 'displayLabel', e.target.value);
                updatePurpose(purpose.id, 'messageTemplate', e.target.value); // UNIFICADO
            }} 
            placeholder="COLETA GERAL"
          />
          <TextField label="Sufixo TXID (G01)" value={purpose.txidSuffix} onChange={e => updatePurpose(purpose.id, 'txidSuffix', e.target.value)} />
          <div className="flex justify-end mt-4">
             <button onClick={() => domain.setPurposes(domain.purposes.filter(k => k.id !== purpose.id))} className="text-destructive text-sm flex items-center gap-1 hover:underline">
               <Trash2 size={14}/> Remover Finalidade
             </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <h2 className="text-xl font-bold mb-6">Administração de Dados</h2>
      
      <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-2">
        {['regionals', 'congregations', 'finalidades'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors ${
              activeSection === tab ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary/50 text-muted-foreground'
            }`}
          >
            {tab === 'regionals' && 'Regionais'}
            {tab === 'congregations' && 'Igrejas'}
            {tab === 'finalidades' && 'Finalidades'}
          </button>
        ))}
      </div>

      {activeSection === 'regionals' && renderRegionals()}
      {activeSection === 'congregations' && renderCongregations()}
      {activeSection === 'finalidades' && renderPurposes()}
      
    </div>
  );
};

export default AdminTab;