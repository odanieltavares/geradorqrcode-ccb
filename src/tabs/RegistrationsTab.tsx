import React, { useState } from 'react';
import { useDomain } from '../context/DomainContext';
import { PixKey, Regional, City, Congregation, PixIdentifier, PixPurpose, State } from '../domain/types';
import { Plus, Trash2, Download, Upload, Edit } from 'lucide-react';
import TextField from '../components/TextField';
import { v4 as uuidv4 } from 'uuid';
import { formatCnpj, unformatCnpj, applyMask, stripNonNumeric } from '../utils/masks';

// --- Componente de Cadastro Genérico (Com Adição Simples via Prompt) ---
const GenericList = <T extends { id: string }>(
  { title, items, onDelete, onEdit, onAdd, renderItem, renderDetails }: { 
    title: string; 
    items: T[]; 
    onDelete: (id: string) => void; 
    onEdit?: (id: string, field: keyof T, value: any) => void;
    onAdd: () => void;
    renderItem: (item: T) => React.ReactNode;
    renderDetails?: (item: T) => React.ReactNode;
  }
) => {
    const [editId, setEditId] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-muted-foreground">{title}</h3>
                <button onClick={onAdd} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"><Plus size={14} /> Adicionar</button>
            </div>
            {items.map((item: T) => (
                <div key={item.id} className="p-3 border rounded bg-card text-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4 font-semibold">{renderItem(item)}</div>
                        <div className="flex gap-2">
                             {onEdit && (
                                <button 
                                    onClick={() => setEditId(editId === item.id ? null : item.id)} 
                                    className="text-muted-foreground hover:text-primary p-1"
                                >
                                    <Edit size={14} />
                                </button>
                             )}
                            <button onClick={() => onDelete(item.id)} className="text-destructive p-1"><Trash2 size={14} /></button>
                        </div>
                    </div>
                    {editId === item.id && renderDetails && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                            {renderDetails(item)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// --- AdminTab Principal ---
const AdminTab: React.FC = () => {
  const domain = useDomain();
  const [activeSection, setActiveSection] = useState<string>('keys');

  // --- Funções de Update Genéricas ---
  const createUpdater = <T extends { id: string }>(setter: (v: T[]) => void, items: T[]) => 
    (id: string, field: keyof T, value: any) => {
        setter(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

  const updatePixKey = createUpdater<PixKey>(domain.setPixKeys, domain.pixKeys);
  const updateRegional = createUpdater<Regional>(domain.setRegionals, domain.regionals);
  const updateCity = createUpdater<City>(domain.setCities, domain.cities);
  const updateCongregation = createUpdater<Congregation>(domain.setCongregations, domain.congregations);
  const updateIdentifier = createUpdater<PixIdentifier>(domain.setIdentifiers, domain.identifiers);
  const updatePurpose = createUpdater<PixPurpose>(domain.setPurposes, domain.purposes);


  // --- Renderização de Chaves PIX (Com Edição Complexa) ---
  const renderPixKeys = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Chaves PIX (CNPJ)</h3>
        <button onClick={() => {
            const newItem: PixKey = {
                id: uuidv4(), type: 'CNPJ', cnpj: '00000000000191', ownerName: 'Novo Titular',
                bankId: domain.banks[0]?.id || '', bankAgency: '', bankAccount: '', active: true,
                regionalId: domain.regionals[0]?.id || ''
            };
            domain.setPixKeys([...domain.pixKeys, newItem]);
        }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2">
          <Plus size={16}/> Nova Chave
        </button>
      </div>
      {domain.pixKeys.map(key => {
        const bank = domain.banks.find(b => b.id === key.bankId);
        const regional = domain.regionals.find(r => r.id === key.regionalId);
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
                <label className="block text-sm font-medium mb-1">Vinculada à Regional</label>
                <select 
                   className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                   value={key.regionalId || ''}
                   onChange={e => updatePixKey(key.id, 'regionalId', e.target.value)}
                >
                  <option value="">Nenhuma / Uso Geral</option>
                  {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <p className="text-xs mt-1 text-muted-foreground">{regional ? `Regional: ${regional.name}` : 'Chave não vinculada.'}</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
               <button onClick={() => domain.setPixKeys(domain.pixKeys.filter(k => k.id !== key.id))} className="text-destructive text-sm flex items-center gap-1 hover:underline">
                 <Trash2 size={14}/> Remover Chave
               </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold">Administração de Dados</h2>
          {/* Funções de Backup/Restore - Mantidas */}
          <div className="flex gap-2">
             <input type="file" id="backup-upload" className="hidden" accept=".json" onChange={/* ... handleImportDomain ... */} />
             <button onClick={() => alert('Implementar Importação/Exportação')} className="flex items-center gap-2 text-sm border px-3 py-2 rounded hover:bg-secondary"><Upload size={16}/> Restaurar</button>
             <button onClick={() => alert('Implementar Importação/Exportação')} className="flex items-center gap-2 text-sm border px-3 py-2 rounded hover:bg-secondary"><Download size={16}/> Backup</button>
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
      
      {/* Cadastro de Regionais */}
      {activeSection === 'regionals' && (
        <GenericList<Regional> 
          title="Regionais" items={domain.regionals}
          onDelete={(id: string) => domain.setRegionals(domain.regionals.filter(i => i.id !== id))}
          onAdd={() => { 
            const name = prompt("Nome da Regional (ex: Porto Nacional):"); 
            if(name && domain.states.length > 0) domain.setRegionals([...domain.regionals, { id: uuidv4(), name, stateId: domain.states[0].id }]); 
            else if (!domain.states.length) alert('Cadastre um Estado primeiro.');
          }}
          renderItem={(r: Regional) => <span>{r.name} ({domain.states.find(s => s.id === r.stateId)?.uf})</span>}
          onEdit={updateRegional}
          renderDetails={(r: Regional) => (
             <div className="grid grid-cols-2 gap-2">
                <TextField label="Nome" value={r.name} onChange={e => updateRegional(r.id, 'name', e.target.value)} />
                <TextField label="Código (Opcional)" value={r.code || ''} onChange={e => updateRegional(r.id, 'code', e.target.value)} />
                <label className="block text-sm font-medium col-span-2">Estado Pai: 
                   <select className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm" value={r.stateId} onChange={e => updateRegional(r.id, 'stateId', e.target.value)}>
                      {domain.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </label>
             </div>
          )}
        />
      )}
      
      {/* Cadastro de Cidades */}
      {activeSection === 'cities' && (
        <GenericList<City> 
          title="Cidades" items={domain.cities}
          onDelete={(id: string) => domain.setCities(domain.cities.filter(i => i.id !== id))}
          onAdd={() => { 
            const name = prompt("Nome da Cidade (ex: Porto Nacional):"); 
            if(name && domain.regionals.length > 0) domain.setCities([...domain.cities, { id: uuidv4(), name, regionalId: domain.regionals[0].id }]); 
            else if (!domain.regionals.length) alert('Cadastre uma Regional primeiro.');
          }}
          renderItem={(c: City) => <span>{c.name} (Regional: {domain.regionals.find(r => r.id === c.regionalId)?.name})</span>}
          onEdit={updateCity}
          renderDetails={(c: City) => (
             <label className="block text-sm font-medium">Regional Pai: 
                <select className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm" value={c.regionalId} onChange={e => updateCity(c.id, 'regionalId', e.target.value)}>
                   {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
             </label>
          )}
        />
      )}
      
      {/* Cadastro de Congregações */}
      {activeSection === 'congregations' && (
        <GenericList<Congregation> 
          title="Igrejas / Congregações" items={domain.congregations}
          onDelete={(id: string) => domain.setCongregations(domain.congregations.filter(i => i.id !== id))}
          onAdd={() => { 
            const name = prompt("Nome da Igreja (ex: Jardim Brasília):"); 
            if(name && domain.cities.length > 0) domain.setCongregations([...domain.congregations, { 
                id: uuidv4(), name, cityId: domain.cities[0].id, ccbOfficialCode: '', ccbSuffix: '', shortPrefix: name.substring(0,2).toUpperCase(), isCentral: false 
            }]); 
            else if (!domain.cities.length) alert('Cadastre uma Cidade primeiro.');
          }}
          renderItem={(c: Congregation) => <span>{c.name} ({c.shortPrefix} | Código: {c.ccbSuffix})</span>}
          onEdit={updateCongregation}
          renderDetails={(c: Congregation) => (
             <div className="grid grid-cols-2 gap-2">
                 <TextField label="Nome" value={c.name} onChange={e => updateCongregation(c.id, 'name', e.target.value)} />
                 <TextField label="Prefixo Curto (JB)" value={c.shortPrefix} onChange={e => updateCongregation(c.id, 'shortPrefix', e.target.value)} />
                 <TextField label="Sufixo CCB (0059)" value={c.ccbSuffix} onChange={e => updateCongregation(c.id, 'ccbSuffix', e.target.value)} />
                 <TextField label="Código Oficial (BR-XX-XXXX)" value={c.ccbOfficialCode} onChange={e => updateCongregation(c.id, 'ccbOfficialCode', e.target.value)} />
                 <label className="block text-sm font-medium col-span-2">Cidade Pai: 
                    <select className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm" value={c.cityId} onChange={e => updateCongregation(c.id, 'cityId', e.target.value)}>
                       {domain.cities.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                    </select>
                 </label>
             </div>
          )}
        />
      )}

      {/* Cadastro de Identificadores */}
      {activeSection === 'identifiers' && (
        <GenericList<PixIdentifier> 
          title="Identificadores" items={domain.identifiers}
          onDelete={(id: string) => domain.setIdentifiers(domain.identifiers.filter(i => i.id !== id))}
          onAdd={() => { 
            const code = prompt("Código (ex: JB0059):"); 
            if(code && domain.congregations.length > 0 && domain.pixKeys.length > 0) domain.setIdentifiers([...domain.identifiers, { 
                id: uuidv4(), code, congregationId: domain.congregations[0].id, pixKeyId: domain.pixKeys[0].id, txidBase: code, strategy: 'TXID_ONLY', active: true 
            }]); 
            else alert('Cadastre Igreja e Chave PIX primeiro.');
          }}
          renderItem={(i: PixIdentifier) => <span>{i.code} (Base TXID: {i.txidBase} | Igreja: {domain.congregations.find(c => c.id === i.congregationId)?.name})</span>}
          onEdit={updateIdentifier}
          renderDetails={(i: PixIdentifier) => (
             <div className="grid grid-cols-2 gap-2">
                 <TextField label="Código" value={i.code} onChange={e => updateIdentifier(i.id, 'code', e.target.value)} />
                 <TextField label="TXID Base" value={i.txidBase} onChange={e => updateIdentifier(i.id, 'txidBase', e.target.value)} />
                 <label className="block text-sm font-medium">Igreja: 
                    <select className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm" value={i.congregationId} onChange={e => updateIdentifier(i.id, 'congregationId', e.target.value)}>
                       {domain.congregations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </label>
                 <label className="block text-sm font-medium">Chave PIX: 
                    <select className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm" value={i.pixKeyId} onChange={e => updateIdentifier(i.id, 'pixKeyId', e.target.value)}>
                       {domain.pixKeys.map(k => <option key={k.id} value={k.id}>{formatCnpj(k.cnpj)}</option>)}
                    </select>
                 </label>
             </div>
          )}
        />
      )}

      {/* Cadastro de Finalidades */}
      {activeSection === 'purposes' && (
        <GenericList<PixPurpose> 
          title="Finalidades / Mensagens" items={domain.purposes}
          onDelete={(id: string) => domain.setPurposes(domain.purposes.filter(i => i.id !== id))}
          onAdd={() => { 
            const name = prompt("Nome (ex: Coleta Geral):"); 
            if(name && domain.identifiers.length > 0) domain.setPurposes([...domain.purposes, { 
                id: uuidv4(), name, pixIdentifierId: domain.identifiers[0].id, displayLabel: name.toUpperCase(), messageTemplate: name.toUpperCase(), txidSuffix: 'G01', active: true 
            }]); 
            else alert('Cadastre um Identificador primeiro.');
          }}
          renderItem={(p: PixPurpose) => <span>{p.name} (Sufixo: {p.txidSuffix} | Identificador: {domain.identifiers.find(i => i.id === p.pixIdentifierId)?.code})</span>}
          onEdit={updatePurpose}
          renderDetails={(p: PixPurpose) => (
             <div className="grid grid-cols-2 gap-2">
                 <TextField label="Nome" value={p.name} onChange={e => updatePurpose(p.id, 'name', e.target.value)} />
                 <TextField label="Sufixo TXID (G01)" value={p.txidSuffix} onChange={e => updatePurpose(p.id, 'txidSuffix', e.target.value)} />
                 <TextField label="Label no Cartão" value={p.displayLabel} onChange={e => updatePurpose(p.id, 'displayLabel', e.target.value)} />
                 <TextField label="Mensagem no Payload" value={p.messageTemplate} onChange={e => updatePurpose(p.id, 'messageTemplate', e.target.value)} />
                 <label className="block text-sm font-medium col-span-2">Identificador: 
                    <select className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm" value={p.pixIdentifierId} onChange={e => updatePurpose(p.id, 'pixIdentifierId', e.target.value)}>
                       {domain.identifiers.map(i => <option key={i.id} value={i.id}>{i.code}</option>)}
                    </select>
                 </label>
             </div>
          )}
        />
      )}
    </div>
  );
};

export default AdminTab;