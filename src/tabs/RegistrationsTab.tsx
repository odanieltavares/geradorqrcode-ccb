
import React, { useState } from 'react';
import { useDomain } from '../context/DomainContext';
import { Bank, PixKey, State, Regional, City, Congregation, PixIdentifier, PixPurpose } from '../domain/types';
import { Plus, Trash2, Save } from 'lucide-react';
import TextField from '../components/TextField';
import { v4 as uuidv4 } from 'uuid';
import { formatCnpj, unformatCnpj, applyMask, stripNonNumeric } from '../utils/masks';

// --- Generic Simple List Component for Admin ---
const EntityList = <T extends { id: string; [key: string]: any }>({
  title, items, renderItem, onAdd, onDelete
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-md font-bold uppercase text-muted-foreground">{title}</h3>
      <button onClick={onAdd} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90">
        <Plus size={14} /> Adicionar
      </button>
    </div>
    {items.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum registro.</p>}
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between p-3 border rounded bg-card text-sm">
          <div className="flex-1 mr-4">{renderItem(item)}</div>
          <button onClick={() => onDelete(item.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

// --- Admin Tab Component ---
const AdminTab: React.FC = () => {
  const domain = useDomain();
  const [activeSection, setActiveSection] = useState<string>('keys');

  // --- Actions ---
  const addPixKey = () => {
    const newItem: PixKey = {
      id: uuidv4(), type: 'CNPJ', cnpj: '', ownerName: 'Novo Titular',
      bankId: domain.banks[0]?.id || '', bankAgency: '', bankAccount: '', active: true
    };
    domain.setPixKeys([...domain.pixKeys, newItem]);
  };

  const updatePixKey = (id: string, field: keyof PixKey, value: any) => {
    domain.setPixKeys(domain.pixKeys.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const renderPixKeys = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Chaves PIX (CNPJ)</h3>
        <button onClick={addPixKey} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2">
          <Plus size={16}/> Nova Chave
        </button>
      </div>
      {domain.pixKeys.map(key => {
        const bank = domain.banks.find(b => b.id === key.bankId);
        return (
          <div key={key.id} className="border rounded p-4 space-y-3 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextField 
                label="Nome do Titular" 
                value={key.ownerName} 
                onChange={e => updatePixKey(key.id, 'ownerName', e.target.value)} 
              />
              <div>
                <label className="block text-sm font-medium mb-1">Banco</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={key.bankId}
                  onChange={e => updatePixKey(key.id, 'bankId', e.target.value)}
                >
                  {domain.banks.map(b => <option key={b.id} value={b.id}>{b.code} - {b.name}</option>)}
                </select>
              </div>
              <TextField 
                label="CNPJ" 
                value={formatCnpj(key.cnpj)}
                onChange={e => updatePixKey(key.id, 'cnpj', unformatCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
              />
              <div className="grid grid-cols-2 gap-2">
                <TextField 
                  label={`Agência (${bank?.agencyMask || ''})`}
                  value={applyMask(key.bankAgency, bank?.agencyMask || '')}
                  onChange={e => updatePixKey(key.id, 'bankAgency', stripNonNumeric(e.target.value))}
                />
                <TextField 
                  label={`Conta (${bank?.accountMask || ''})`}
                  value={applyMask(key.bankAccount, bank?.accountMask || '')}
                  onChange={e => updatePixKey(key.id, 'bankAccount', stripNonNumeric(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vinculado à Regional</label>
                <select 
                   className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                   value={key.regionalId || ''}
                   onChange={e => updatePixKey(key.id, 'regionalId', e.target.value)}
                >
                  <option value="">Nenhuma / Uso Geral</option>
                  {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
               <button onClick={() => domain.setPixKeys(domain.pixKeys.filter(k => k.id !== key.id))} className="text-destructive text-sm flex items-center gap-1 hover:underline">
                 <Trash2 size={14}/> Remover Chave
               </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- Simple handlers for other entities for MVP brevity ---
  // In a real app, these would be elaborate forms too.
  
  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <h2 className="text-xl font-bold mb-6">Administração de Dados</h2>
      
      <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-2">
        {['keys', 'regionals', 'cities', 'congregations', 'identifiers', 'purposes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors ${
              activeSection === tab ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary/50 text-muted-foreground'
            }`}
          >
            {tab === 'keys' && 'Chaves PIX'}
            {tab === 'regionals' && 'Regionais'}
            {tab === 'cities' && 'Cidades'}
            {tab === 'congregations' && 'Igrejas'}
            {tab === 'identifiers' && 'Identificadores'}
            {tab === 'purposes' && 'Finalidades'}
          </button>
        ))}
      </div>

      {activeSection === 'keys' && renderPixKeys()}
      
      {activeSection === 'regionals' && (
        <EntityList 
          title="Regionais" items={domain.regionals}
          onAdd={() => {
            const name = prompt("Nome da Regional:");
            if(name) domain.setRegionals([...domain.regionals, { id: uuidv4(), name, stateId: domain.states[0].id }]);
          }}
          onDelete={(id) => domain.setRegionals(domain.regionals.filter(i => i.id !== id))}
          renderItem={(item) => <span>{item.name} <span className="text-xs text-muted-foreground">({item.code})</span></span>}
        />
      )}

       {activeSection === 'cities' && (
        <EntityList 
          title="Cidades" items={domain.cities}
          onAdd={() => {
             const name = prompt("Nome da Cidade:");
             if(name) domain.setCities([...domain.cities, { id: uuidv4(), name, regionalId: domain.regionals[0].id }]);
          }}
          onDelete={(id) => domain.setCities(domain.cities.filter(i => i.id !== id))}
          renderItem={(item) => <span>{item.name}</span>}
        />
      )}

      {activeSection === 'congregations' && (
        <EntityList 
          title="Igrejas / Comuns" items={domain.congregations}
          onAdd={() => {
             const name = prompt("Nome da Igreja:");
             if(name) domain.setCongregations([...domain.congregations, { id: uuidv4(), name, cityId: domain.cities[0].id, ccbOfficialCode: '', ccbSuffix: '', shortPrefix: '', isCentral: false }]);
          }}
          onDelete={(id) => domain.setCongregations(domain.congregations.filter(i => i.id !== id))}
          renderItem={(item) => <span>{item.name} <span className="text-xs text-muted-foreground">({item.ccbOfficialCode})</span></span>}
        />
      )}

       {activeSection === 'identifiers' && (
        <EntityList 
          title="Identificadores (Códigos)" items={domain.identifiers}
          onAdd={() => {
             const code = prompt("Código (ex: JB0059):");
             if(code) domain.setIdentifiers([...domain.identifiers, { id: uuidv4(), code, congregationId: '', pixKeyId: '', txidBase: '', strategy: 'TXID_ONLY', active: true }]);
          }}
          onDelete={(id) => domain.setIdentifiers(domain.identifiers.filter(i => i.id !== id))}
          renderItem={(item) => <span>{item.code} <span className="text-xs text-muted-foreground">Base: {item.txidBase}</span></span>}
        />
      )}

      {activeSection === 'purposes' && (
        <EntityList 
          title="Finalidades de Coleta" items={domain.purposes}
          onAdd={() => {
             const name = prompt("Nome (ex: Coleta Geral):");
             if(name) domain.setPurposes([...domain.purposes, { id: uuidv4(), name, pixIdentifierId: '', shortCode: '', displayLabel: name, messageTemplate: '', txidSuffix: '', active: true }]);
          }}
          onDelete={(id) => domain.setPurposes(domain.purposes.filter(i => i.id !== id))}
          renderItem={(item) => <span>{item.displayLabel} <span className="text-xs text-muted-foreground">({item.txidSuffix})</span></span>}
        />
      )}
      
      <div className="mt-8 p-4 bg-muted/20 rounded text-xs text-muted-foreground">
        <p>Nota: Esta é uma visualização simplificada para o MVP. Em um sistema real, cada entidade teria seu próprio formulário detalhado com validações e seletores em cascata.</p>
      </div>
    </div>
  );
};

export default AdminTab;
