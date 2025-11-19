import React, { useState, useMemo } from 'react';
import { useDomain } from '../context/DomainContext';
import { Regional, Congregation, PixPurpose } from '../domain/types';
import { Plus, Download, Upload, Search } from 'lucide-react';
import TextField from '../components/TextField';
import { v4 as uuidv4 } from 'uuid';
import { formatCnpj, unformatCnpj, applyMask, stripNonNumeric } from '../utils/masks';
import AccordionItem from '../components/AccordionItem';

const AdminTab: React.FC = () => {
  const domain = useDomain();
  const [activeSection, setActiveSection] = useState<string>('regionals'); 
  const [searchStateId, setSearchStateId] = useState('');
  const [searchCityId, setSearchCityId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper para atualizar itens
  const createUpdater = <T extends { id: string }>(setter: (v: T[]) => void, items: T[]) => 
    (id: string, field: keyof T, value: any) => {
        setter(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

  const updateRegional = createUpdater<Regional>(domain.setRegionals, domain.regionals);
  const updateCongregation = createUpdater<Congregation>(domain.setCongregations, domain.congregations);
  const updatePurpose = createUpdater<PixPurpose>(domain.setPurposes, domain.purposes);

  // --- Funções de Adicionar (TOPO DA LISTA) ---
  const handleAddRegional = () => {
      if(domain.states.length === 0 || domain.banks.length === 0) return alert('Erro: Banco ou Estado não cadastrados no sistema base.');
      
      const newItem: Regional = {
          id: uuidv4(), name: 'Nova Regional', stateId: domain.states[0].id, active: true,
          cnpj: '', ownerName: 'CCB DO BRASIL', bankId: domain.banks[0].id,
          bankAgency: '', bankAccount: '', regionalCityName: 'CIDADE'
      };
      domain.setRegionals([newItem, ...domain.regionals]); // Adiciona ao topo
  };

  const handleAddCongregation = () => {
      if(domain.regionals.length === 0 || domain.cities.length === 0) return alert('Cadastre Regional e Cidade primeiro.');
      
      const defaultRegional = domain.regionals[0];
      const defaultCity = domain.cities.find(c => c.regionalId === defaultRegional.id) || domain.cities[0];
      
      const newItem: Congregation = { 
          id: uuidv4(), name: 'Nova Igreja', cityId: defaultCity.id, regionalId: defaultRegional.id, 
          ccbOfficialCode: '', ccbSuffix: '', shortPrefix: '', isCentral: false, 
          txidBase: '', extraCents: 0, active: true
      };
      domain.setCongregations([newItem, ...domain.congregations]); // Adiciona ao topo
  };
  
  const handleAddPurpose = () => {
    const newItem: PixPurpose = { id: uuidv4(), name: 'Nova Coleta', displayLabel: 'NOVA COLETA', messageTemplate: 'NOVA COLETA', txidSuffix: '', active: true };
    domain.setPurposes([newItem, ...domain.purposes]); // Adiciona ao topo
  };

  // --- Renderizações ---

  const renderRegionals = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Regionais</h3>
        <button onClick={handleAddRegional} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16}/> Nova Regional</button>
      </div>
      
      {domain.regionals.map(regional => (
          <AccordionItem
            key={regional.id}
            id={regional.id}
            title={regional.name}
            subtitle={regional.cnpj ? formatCnpj(regional.cnpj) : 'Sem CNPJ'}
            onDelete={(id) => domain.setRegionals(domain.regionals.filter(k => k.id !== id))}
            defaultOpen={regional.name === 'Nova Regional'}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
              <TextField label="Nome da Regional" value={regional.name} onChange={e => updateRegional(regional.id, 'name', e.target.value)} />
              <div>
                <label className="block text-xs font-medium mb-1">Estado</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={regional.stateId || ''} onChange={e => updateRegional(regional.id, 'stateId', e.target.value)}>
                  {domain.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <TextField label="CNPJ" value={formatCnpj(regional.cnpj)} onChange={e => updateRegional(regional.id, 'cnpj', unformatCnpj(e.target.value))} />
              <TextField label="Cidade Sede (PIX)" value={regional.regionalCityName} onChange={e => updateRegional(regional.id, 'regionalCityName', e.target.value)} />
              
              <div className="md:col-span-2 border-t pt-2 mt-2">
                 <p className="text-xs font-bold mb-2 text-muted-foreground">Dados Bancários</p>
                 <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                         <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={regional.bankId || ''} onChange={e => updateRegional(regional.id, 'bankId', e.target.value)}>
                            {domain.banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <TextField label="Agência" value={regional.bankAgency} onChange={e => updateRegional(regional.id, 'bankAgency', stripNonNumeric(e.target.value))} />
                    <TextField label="Conta" value={regional.bankAccount} onChange={e => updateRegional(regional.id, 'bankAccount', stripNonNumeric(e.target.value))} />
                 </div>
              </div>
            </div>
          </AccordionItem>
      ))}
    </div>
  );

  // Filtro de Congregações
  const filteredCongregations = useMemo(() => {
    let list = domain.congregations;
    if (searchStateId) {
       const regionalsInState = domain.regionals.filter(r => r.stateId === searchStateId).map(r => r.id);
       list = list.filter(c => regionalsInState.includes(c.regionalId));
    }
    if (searchCityId) list = list.filter(c => c.cityId === searchCityId);
    if (searchQuery) {
       const q = searchQuery.toLowerCase();
       list = list.filter(c => c.name.toLowerCase().includes(q) || c.shortPrefix.toLowerCase().includes(q));
    }
    return list;
  }, [domain.congregations, domain.regionals, searchStateId, searchCityId, searchQuery]);

  const renderCongregations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Igrejas / Congregações</h3>
        <button onClick={handleAddCongregation} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16}/> Nova Igreja</button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-secondary/30 rounded-lg">
          <select className="h-9 rounded-md border px-3 text-sm" value={searchStateId} onChange={e => { setSearchStateId(e.target.value); setSearchCityId(''); }}>
             <option value="">Todos os Estados</option>
             {domain.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="h-9 rounded-md border px-3 text-sm" value={searchCityId} onChange={e => setSearchCityId(e.target.value)} disabled={!searchStateId}>
             <option value="">Todas as Cidades</option>
             {domain.cities.filter(c => {
                 const reg = domain.regionals.find(r => r.id === c.regionalId);
                 return reg && reg.stateId === searchStateId;
             }).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground"/>
              <input type="text" placeholder="Buscar..." className="h-9 w-full rounded-md border pl-9 pr-3 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
      </div>

      {filteredCongregations.map(cong => {
        // Lógica para filtrar cidades da regional selecionada PARA ESTE ITEM
        const currentRegionalCities = domain.cities.filter(c => c.regionalId === cong.regionalId);
        
        return (
          <AccordionItem
            key={cong.id}
            id={cong.id}
            title={cong.name}
            subtitle={`${cong.shortPrefix}${cong.ccbSuffix}`}
            onDelete={(id) => domain.setCongregations(domain.congregations.filter(k => k.id !== id))}
            defaultOpen={cong.name === 'Nova Igreja'}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
                <TextField label="Nome" value={cong.name} onChange={e => updateCongregation(cong.id, 'name', e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                    <TextField label="Prefixo" value={cong.shortPrefix} onChange={e => updateCongregation(cong.id, 'shortPrefix', e.target.value)} />
                    <TextField label="Sufixo" value={cong.ccbSuffix} onChange={e => updateCongregation(cong.id, 'ccbSuffix', e.target.value)} />
                    <TextField label="Centavos" value={String(cong.extraCents)} onChange={e => updateCongregation(cong.id, 'extraCents', Number(e.target.value))} />
                </div>
                
                <div className="md:col-span-2 grid grid-cols-2 gap-3 border-t pt-2">
                    <div>
                        <label className="block text-xs font-medium mb-1">Regional (Financeiro)</label>
                        {/* CORREÇÃO DO BUG DE SELECT: onChange atualiza regional E reseta cidade */}
                        <select 
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" 
                            value={cong.regionalId || ''} 
                            onChange={e => {
                                const newRegId = e.target.value;
                                const firstCity = domain.cities.find(c => c.regionalId === newRegId);
                                updateCongregation(cong.id, 'regionalId', newRegId);
                                updateCongregation(cong.id, 'cityId', firstCity ? firstCity.id : '');
                            }}
                        >
                            {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Cidade (Local)</label>
                        <select 
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" 
                            value={cong.cityId || ''} 
                            onChange={e => updateCongregation(cong.id, 'cityId', e.target.value)}
                            disabled={currentRegionalCities.length === 0}
                        >
                            {currentRegionalCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            {currentRegionalCities.length === 0 && <option value="">Sem cidades nesta regional</option>}
                        </select>
                    </div>
                </div>
                <TextField label="TXID Base" value={cong.txidBase} onChange={e => updateCongregation(cong.id, 'txidBase', e.target.value)} />
            </div>
          </AccordionItem>
      )})}
    </div>
  );

  const renderPurposes = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Finalidades</h3>
            <button onClick={handleAddPurpose} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16}/> Nova</button>
        </div>
        {domain.purposes.map(p => (
             <AccordionItem key={p.id} id={p.id} title={p.displayLabel} subtitle={p.txidSuffix} onDelete={id => domain.setPurposes(domain.purposes.filter(x => x.id !== id))} defaultOpen={p.name === 'Nova Coleta'}>
                 <div className="grid grid-cols-2 gap-3 p-1">
                    <TextField label="Nome Interno" value={p.name} onChange={e => updatePurpose(p.id, 'name', e.target.value)} />
                    <TextField label="Rótulo (Cartão)" value={p.displayLabel} onChange={e => { updatePurpose(p.id, 'displayLabel', e.target.value); updatePurpose(p.id, 'messageTemplate', e.target.value); }} />
                    <TextField label="Sufixo TXID" value={p.txidSuffix} onChange={e => updatePurpose(p.id, 'txidSuffix', e.target.value)} />
                 </div>
             </AccordionItem>
        ))}
    </div>
  );

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-2">
        {['regionals', 'congregations', 'finalidades'].map(tab => (
          <button key={tab} onClick={() => setActiveSection(tab)} className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md ${activeSection === tab ? 'bg-secondary' : ''}`}>
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