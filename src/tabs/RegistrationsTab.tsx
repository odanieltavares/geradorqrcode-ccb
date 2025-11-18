import React, { useState } from 'react';
import { useDomain } from '../context/DomainContext';
import { PixKey } from '../domain/types';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import TextField from '../components/TextField';
import { v4 as uuidv4 } from 'uuid';
import { formatCnpj, unformatCnpj, applyMask, stripNonNumeric } from '../utils/masks';

const AdminTab: React.FC = () => {
  const domain = useDomain();
  const [activeSection, setActiveSection] = useState<string>('keys');

  // --- Backup Functions ---
  const handleExportDomain = () => {
    const fullData = {
        states: domain.states,
        regionals: domain.regionals,
        cities: domain.cities,
        congregations: domain.congregations,
        banks: domain.banks,
        pixKeys: domain.pixKeys,
        identifiers: domain.identifiers,
        purposes: domain.purposes
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fullData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "backup_sistema_pix.json";
    link.click();
  };

  const handleImportDomain = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (data.states) domain.setStates(data.states);
              if (data.regionals) domain.setRegionals(data.regionals);
              if (data.cities) domain.setCities(data.cities);
              if (data.congregations) domain.setCongregations(data.congregations);
              if (data.banks) domain.setBanks(data.banks);
              if (data.pixKeys) domain.setPixKeys(data.pixKeys);
              if (data.identifiers) domain.setIdentifiers(data.identifiers);
              if (data.purposes) domain.setPurposes(data.purposes);
              alert('Backup restaurado com sucesso!');
          } catch (err) {
              alert('Erro ao processar arquivo de backup.');
          }
      };
      reader.readAsText(file);
  };


  // --- Helpers ---
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
                maxLength={18}
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

  // Listas Genéricas
  const GenericList = ({ title, items, onDelete, renderItem, onAdd }: any) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-bold text-muted-foreground">{title}</h3>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"><Plus size={14} /> Adicionar</button>
      </div>
      {items.map((item: any) => (
        <div key={item.id} className="flex items-center justify-between p-3 border rounded bg-card text-sm">
          <div className="flex-1 mr-4">{renderItem(item)}</div>
          <button onClick={() => onDelete(item.id)} className="text-destructive p-1"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold">Administração de Dados</h2>
          <div className="flex gap-2">
             <input type="file" id="backup-upload" className="hidden" accept=".json" onChange={handleImportDomain} />
             <button onClick={() => document.getElementById('backup-upload')?.click()} className="flex items-center gap-2 text-sm border px-3 py-2 rounded hover:bg-secondary"><Upload size={16}/> Restaurar</button>
             <button onClick={handleExportDomain} className="flex items-center gap-2 text-sm border px-3 py-2 rounded hover:bg-secondary"><Download size={16}/> Backup</button>
          </div>
      </div>
      
      <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-2">
        {['keys', 'regionals', 'cities', 'congregations', 'identifiers', 'purposes'].map(tab => (
          <button key={tab} onClick={() => setActiveSection(tab)} className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md ${activeSection === tab ? 'bg-secondary' : ''}`}>
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
      {activeSection === 'identifiers' && <GenericList title="Identificadores" items={domain.identifiers} onDelete={(id: string) => domain.setIdentifiers(domain.identifiers.filter(i => i.id !== id))} onAdd={() => { const code = prompt("Código (ex: JB0059):"); if(code) domain.setIdentifiers([...domain.identifiers, { id: uuidv4(), code, congregationId: '', pixKeyId: '', txidBase: code, strategy: 'TXID_ONLY', active: true }]); }} renderItem={(i: any) => <span>{i.code} (Base: {i.txidBase})</span>} />}
      {activeSection === 'purposes' && <GenericList title="Finalidades" items={domain.purposes} onDelete={(id: string) => domain.setPurposes(domain.purposes.filter(i => i.id !== id))} onAdd={() => { const name = prompt("Nome:"); if(name) domain.setPurposes([...domain.purposes, { id: uuidv4(), name, pixIdentifierId: '', displayLabel: name, messageTemplate: name, txidSuffix: 'G01', active: true }]); }} renderItem={(p: any) => <span>{p.displayLabel}</span>} />}
      {activeSection === 'regionals' && <GenericList title="Regionais" items={domain.regionals} onDelete={(id: string) => domain.setRegionals(domain.regionals.filter(i => i.id !== id))} onAdd={() => { const name = prompt("Nome:"); if(name) domain.setRegionals([...domain.regionals, { id: uuidv4(), name, stateId: domain.states[0].id }]); }} renderItem={(p: any) => <span>{p.name}</span>} />}
      {activeSection === 'cities' && <GenericList title="Cidades" items={domain.cities} onDelete={(id: string) => domain.setCities(domain.cities.filter(i => i.id !== id))} onAdd={() => { const name = prompt("Nome:"); if(name) domain.setCities([...domain.cities, { id: uuidv4(), name, regionalId: domain.regionals[0].id }]); }} renderItem={(p: any) => <span>{p.name}</span>} />}
      {activeSection === 'congregations' && <GenericList title="Congregações" items={domain.congregations} onDelete={(id: string) => domain.setCongregations(domain.congregations.filter(i => i.id !== id))} onAdd={() => { const name = prompt("Nome:"); if(name) domain.setCongregations([...domain.congregations, { id: uuidv4(), name, cityId: domain.cities[0].id, ccbOfficialCode: '', ccbSuffix: '', shortPrefix: '', isCentral: false }]); }} renderItem={(p: any) => <span>{p.name}</span>} />}
    </div>
  );
};

export default AdminTab;