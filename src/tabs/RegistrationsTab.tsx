import React, { useState, useMemo, useCallback } from 'react';
import { useDomain } from '../context/DomainContext';
import { Regional, Congregation, PixPurpose, State, City } from '../domain/types';
import { Plus, Download, Upload, Search } from 'lucide-react';
import TextField from '../components/TextField';
import { v4 as uuidv4 } from 'uuid';
import { formatCnpj, unformatCnpj, applyMask, stripNonNumeric } from '../utils/masks';
import AccordionItem from '../components/AccordionItem';

// Helper para exportar dados
const handleExportDomain = (domain: any) => {
    const fullData = {
        states: domain.states, regionals: domain.regionals, cities: domain.cities,
        congregations: domain.congregations, banks: domain.banks, purposes: domain.purposes
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fullData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `backup_sistema_pix_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    alert('Backup exportado com sucesso!');
};

// Helper para importar dados
const handleImportDomain = (event: React.ChangeEvent<HTMLInputElement>, domain: any) => {
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
            if (data.purposes) domain.setPurposes(data.purposes);
            alert('Backup restaurado com sucesso! (Pode ser necessário recarregar a página)');
        } catch (err) {
            alert('Erro ao processar arquivo de backup. Verifique o formato JSON.');
        }
    };
    reader.readAsText(file);
};


// --- Admin Tab Component ---
const AdminTab: React.FC = () => {
  const domain = useDomain();
  const [activeSection, setActiveSection] = useState<string>('regionals'); 
  const [searchStateId, setSearchStateId] = useState('');
  const [searchCityId, setSearchCityId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Funções de Update Genéricas ---
  const createUpdater = <T extends { id: string }>(setter: (v: T[]) => void, items: T[]) => 
    (id: string, field: keyof T, value: any) => {
        setter(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

  const updateRegional = createUpdater<Regional>(domain.setRegionals, domain.regionals);
  const updateCongregation = createUpdater<Congregation>(domain.setCongregations, domain.congregations);
  const updatePurpose = createUpdater<PixPurpose>(domain.setPurposes, domain.purposes);

  // --- Funções de Adicionar Corrigidas (Garantindo dados mínimos) ---
  const handleAddRegional = () => {
      if(domain.states.length === 0 || domain.banks.length === 0) return alert('Cadastre Bancos e Estados primeiro (via mockData.ts ou no console).');
      const defaultBankId = domain.banks[0].id;
      const defaultStateId = domain.states[0].id;

      const newItem: Regional = {
          id: uuidv4(), name: 'Nova Regional', stateId: defaultStateId, active: true,
          cnpj: '00000000000100', ownerName: 'Novo Titular CCB', bankId: defaultBankId,
          bankAgency: '0000', bankAccount: '00000', regionalCityName: 'CIDADE'
      };
      domain.setRegionals([...domain.regionals, newItem]);
  };

  const handleAddCongregation = () => {
      if(domain.regionals.length === 0 || domain.cities.length === 0) return alert('Cadastre Regional e Cidade primeiro.');
      const defaultRegionalId = domain.regionals[0].id;
      const defaultCityId = domain.cities.find(c => c.regionalId === defaultRegionalId)?.id || domain.cities[0].id;
      domain.setCongregations([...domain.congregations, { 
          id: uuidv4(), name: 'Nova Igreja', cityId: defaultCityId, regionalId: defaultRegionalId, 
          ccbOfficialCode: 'BR-XX-XXXX', ccbSuffix: 'XXXX', shortPrefix: 'NVI', isCentral: false, 
          txidBase: 'BRXXXXXX', extraCents: 0, active: true
      }]); 
  };
  
  const handleAddPurpose = () => {
    domain.setPurposes([...domain.purposes, { id: uuidv4(), name: 'Nova Coleta', displayLabel: 'NOVA COLETA', messageTemplate: 'NOVA COLETA', txidSuffix: 'N01', active: true }]);
  };


  // --- Renderização de Regionais ---
  const renderRegionals = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Regionais (Centro Financeiro)</h3>
        <button onClick={handleAddRegional} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2">
          <Plus size={16}/> Nova Regional
        </button>
      </div>
      
      {domain.regionals.map(regional => {
        const bank = domain.banks.find(b => b.id === regional.bankId);
        const state = domain.states.find(s => s.id === regional.stateId);
        
        return (
          <AccordionItem
            key={regional.id}
            id={regional.id}
            title={regional.name}
            subtitle={`CNPJ: ${formatCnpj(regional.cnpj)} | Banco: ${bank?.code}`}
            onDelete={(id) => domain.setRegionals(domain.regionals.filter(k => k.id !== id))}
          >
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
          </AccordionItem>
        );
      })}
    </div>
  );

  // --- Filtragem de Congregações ---
  const filteredCongregations = useMemo(() => {
    let list = domain.congregations;
    
    // 1. Filtrar por Estado (via Regional)
    if (searchStateId) {
      const regionalIdsInState = domain.regionals.filter(r => r.stateId === searchStateId).map(r => r.id);
      list = list.filter(c => regionalIdsInState.includes(c.regionalId));
    }
    
    // 2. Filtrar por Cidade
    if (searchCityId) {
      list = list.filter(c => c.cityId === searchCityId);
    }

    // 3. Filtrar por Query (Nome ou Código)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.ccbOfficialCode.toLowerCase().includes(query) || 
        c.shortPrefix.toLowerCase().includes(query)
      );
    }

    return list;
  }, [domain.congregations, domain.regionals, searchStateId, searchCityId, searchQuery]);


  // --- Renderização de Igrejas ---
  const renderCongregations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Igrejas / Congregações (Identificador da Transação)</h3>
         <button onClick={handleAddCongregation} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2">
          <Plus size={16}/> Nova Igreja
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-secondary/30 rounded-lg border border-border/50">
        <div>
          <label className="block text-xs font-medium mb-1">Filtrar por Estado</label>
          <select value={searchStateId} onChange={e => { setSearchStateId(e.target.value); setSearchCityId(''); }} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todos os Estados</option>
            {domain.states.map(s => <option key={s.id} value={s.id}>{s.name} ({s.uf})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Filtrar por Cidade</label>
          <select value={searchCityId} onChange={e => setSearchCityId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" disabled={!searchStateId}>
            <option value="">Todas as Cidades</option>
            {domain.cities
                .filter(c => {
                    const regional = domain.regionals.find(r => r.id === c.regionalId);
                    return !searchStateId || regional?.stateId === searchStateId;
                })
                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="relative">
          <label className="block text-xs font-medium mb-1">Pesquisar (Nome/Código)</label>
          <Search size={16} className="absolute left-3 top-1/2 mt-0.5 transform -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Nome ou código..."
            className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3 text-sm"
          />
        </div>
      </div>
      
      {filteredCongregations.map(congregation => {
        const regional = domain.regionals.find(r => r.id === congregation.regionalId);
        const city = domain.cities.find(c => c.id === congregation.cityId);
        const citiesFilteredByRegional = domain.cities.filter(c => c.regionalId === congregation.regionalId);
        
        return (
          <AccordionItem
            key={congregation.id}
            id={congregation.id}
            title={`${congregation.name} (${congregation.shortPrefix}${congregation.ccbSuffix})`}
            subtitle={`Regional: ${regional?.name} | Cidade: ${city?.name}`}
            onDelete={(id) => domain.setCongregations(domain.congregations.filter(k => k.id !== id))}
            // onPreview={handlePreviewCongregation} // Não implementado aqui, mas disponível
          >
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
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={congregation.regionalId} onChange={e => { updateCongregation(congregation.id, 'regionalId', e.target.value); updateCongregation(congregation.id, 'cityId', citiesFilteredByRegional.find(c => c.regionalId === e.target.value)?.id || ''); }}>
                       {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
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
          </AccordionItem>
        );
      })}
    </div>
  );

  // --- Renderização de Finalidades ---
  const renderPurposes = () => (
     <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Finalidades / Mensagens (Coletas)</h3>
        <button onClick={handleAddPurpose} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2">
          <Plus size={16}/> Nova Finalidade
        </button>
      </div>
      
      {domain.purposes.map(purpose => (
        <AccordionItem
            key={purpose.id}
            id={purpose.id}
            title={purpose.displayLabel}
            subtitle={`Sufixo TXID: ${purpose.txidSuffix}`}
            onDelete={(id) => domain.setPurposes(domain.purposes.filter(k => k.id !== id))}
          >
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
          </AccordionItem>
      ))}
    </div>
  );

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold">Administração de Dados</h2>
          
          <div className="flex gap-2">
             <input type="file" id="backup-upload" className="hidden" accept=".json" onChange={(e) => handleImportDomain(e, domain)} />
             <button onClick={() => document.getElementById('backup-upload')?.click()} className="flex items-center gap-2 text-sm border px-3 py-2 rounded hover:bg-secondary"><Upload size={16}/> Restaurar JSON</button>
             <button onClick={() => handleExportDomain(domain)} className="flex items-center gap-2 text-sm border px-3 py-2 rounded hover:bg-secondary"><Download size={16}/> Backup JSON</button>
          </div>
      </div>
      
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