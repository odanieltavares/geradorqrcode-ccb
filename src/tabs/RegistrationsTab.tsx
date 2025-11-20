import React, { useState, useMemo, useEffect } from 'react';
import { useDomain } from '../context/DomainContext';
import { Regional, Congregation, PixPurpose } from '../domain/types';
import { Plus, Download, Upload, Search, FileSpreadsheet } from 'lucide-react';
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
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const createUpdater = <T extends { id: string }>(setter: (v: T[]) => void, items: T[]) =>
    (id: string, field: keyof T, value: any) => {
      setter(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

  const updateRegional = createUpdater<Regional>(domain.setRegionals, domain.regionals);
  const updateCongregation = createUpdater<Congregation>(domain.setCongregations, domain.congregations);
  const updatePurpose = createUpdater<PixPurpose>(domain.setPurposes, domain.purposes);

  // Sincroniza cidade quando regional muda
  useEffect(() => {
    domain.congregations.forEach(cong => {
      const citiesInRegional = domain.cities.filter(c => c.regionalId === cong.regionalId);
      // Se a cidade atual não pertence à regional atual, atualiza para a primeira cidade disponível
      if (cong.cityId && !citiesInRegional.find(c => c.id === cong.cityId)) {
        const firstCity = citiesInRegional[0];
        if (firstCity) {
          updateCongregation(cong.id, 'cityId', firstCity.id);
        }
      }
    });
  }, [domain.congregations.map(c => c.regionalId).join(',')]);


  // --- Adicionar (Topo) ---
  const handleAddRegional = () => {
    if (domain.states.length === 0 || domain.banks.length === 0) return alert('Erro base: Bancos/Estados não carregados.');
    const newItem: Regional = {
      id: uuidv4(), name: 'NOVA REGIONAL', stateId: domain.states[0].id, active: true,
      cnpj: '', ownerName: 'CCB DO BRASIL', bankId: domain.banks[0].id,
      bankAgency: '', bankAccount: '', regionalCityName: 'SAO PAULO'
    };
    domain.setRegionals([newItem, ...domain.regionals]);
  };

  const handleAddCongregation = () => {
    if (domain.regionals.length === 0 || domain.cities.length === 0) return alert('Cadastre Regional e Cidade primeiro.');
    const defaultReg = domain.regionals[0];
    const defaultCity = domain.cities.find(c => c.regionalId === defaultReg.id) || domain.cities[0];
    const newItem: Congregation = {
      id: uuidv4(), name: 'NOVA IGREJA', cityId: defaultCity.id, regionalId: defaultReg.id,
      ccbOfficialCode: '', ccbSuffix: '', shortPrefix: '', isCentral: false,
      txidBase: '', extraCents: null, active: true
    };
    domain.setCongregations([newItem, ...domain.congregations]);
  };

  const handleAddPurpose = () => {
    const newItem: PixPurpose = { id: uuidv4(), name: 'Nova Coleta', displayLabel: 'NOVA COLETA', messageTemplate: 'NOVA COLETA', txidSuffix: '', active: true };
    domain.setPurposes([newItem, ...domain.purposes]);
  };

  // --- Helpers CSV Template ---
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Valor (Opcional),Mensagem Personalizada (Opcional)\n"
      + "10.00,OFERTA AMOR\n"
      + "20.50,\n"
      + ",MANUTENCAO";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_importacao_lote.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Regionais ---
  const renderRegionals = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Regionais (Financeiro)</h3>
        <button onClick={handleAddRegional} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16} /> Nova Regional</button>
      </div>

      {domain.regionals.map(regional => {
        const bank = domain.banks.find(b => b.id === regional.bankId);
        return (
          <AccordionItem
            key={regional.id}
            id={regional.id}
            title={regional.name}
            subtitle={regional.cnpj ? formatCnpj(regional.cnpj) : 'Sem CNPJ'}
            onDelete={(id) => domain.setRegionals(domain.regionals.filter(k => k.id !== id))}
            defaultOpen={regional.name === 'NOVA REGIONAL'}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
              <TextField label="Nome da Regional" value={regional.name} onChange={e => updateRegional(regional.id, 'name', e.target.value.toUpperCase())} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Estado</label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={regional.stateId || ''} onChange={e => updateRegional(regional.id, 'stateId', e.target.value)}>
                    {domain.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <TextField label="Cidade Sede (PIX)" value={regional.regionalCityName} onChange={e => updateRegional(regional.id, 'regionalCityName', e.target.value.toUpperCase())} />
              </div>

              <TextField label="CNPJ" value={formatCnpj(regional.cnpj)} onChange={e => updateRegional(regional.id, 'cnpj', unformatCnpj(e.target.value))} />
              <TextField label="Titular (Recebedor)" value={regional.ownerName} onChange={e => updateRegional(regional.id, 'ownerName', e.target.value.toUpperCase())} />

              <div className="md:col-span-2 border-t pt-3 mt-1">
                <p className="text-xs font-bold mb-2 text-primary">Dados Bancários (Para exibição no cartão)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Banco</label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={regional.bankId || ''} onChange={e => updateRegional(regional.id, 'bankId', e.target.value)}>
                      {domain.banks.map(b => <option key={b.id} value={b.id}>{b.code} - {b.name}</option>)}
                    </select>
                  </div>
                  {/* CORREÇÃO: Máscaras aplicadas corretamente */}
                  <TextField
                    label={`Agência (${bank?.agencyMask || '#'})`}
                    value={applyMask(regional.bankAgency, bank?.agencyMask || '####')}
                    onChange={e => updateRegional(regional.id, 'bankAgency', stripNonNumeric(e.target.value))}
                  />
                  <TextField
                    label={`Conta (${bank?.accountMask || '#'})`}
                    value={applyMask(regional.bankAccount, bank?.accountMask || '#####-#')}
                    onChange={e => updateRegional(regional.id, 'bankAccount', stripNonNumeric(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </AccordionItem>
        )
      })}
    </div>
  );

  // --- Render Igrejas ---
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
        <h3 className="text-lg font-semibold">Igrejas | Congregações</h3>
        <button onClick={handleAddCongregation} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16} /> Nova Igreja</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-secondary/30 rounded-lg border">
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
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input type="text" placeholder="Buscar nome ou código..." className="h-9 w-full rounded-md border pl-9 pr-3 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {filteredCongregations.map(cong => {
        const currentRegionalCities = domain.cities.filter(c => c.regionalId === cong.regionalId);
        // Cálculo automático do TXID Base
        const txidBase = (cong.shortPrefix || '') + (cong.ccbSuffix || '');

        return (
          <AccordionItem
            key={cong.id}
            id={cong.id}
            title={cong.name}
            subtitle={`${cong.shortPrefix || '?'} | ${cong.ccbSuffix || '?'}`}
            onDelete={(id) => domain.setCongregations(domain.congregations.filter(k => k.id !== id))}
            defaultOpen={cong.name === 'NOVA IGREJA'}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
              <TextField
                label="Nome da Comum"
                value={cong.name}
                onChange={e => updateCongregation(cong.id, 'name', e.target.value.toUpperCase())}
                onFocus={e => { if (e.target.value === 'NOVA IGREJA') e.target.select(); }}
                placeholder="Ex: JARDIM BRASILIA"
              />
              <div className="grid grid-cols-3 gap-2">
                <TextField
                  label="Prefixo (JB)"
                  value={cong.shortPrefix}
                  onChange={e => updateCongregation(cong.id, 'shortPrefix', e.target.value.toUpperCase())}
                  placeholder="Ex: JB"
                  maxLength={10}
                />
                <TextField
                  label="Sufixo (Cód)"
                  value={cong.ccbSuffix}
                  onChange={e => updateCongregation(cong.id, 'ccbSuffix', e.target.value.toUpperCase())}
                  placeholder="Ex: 0059"
                  maxLength={10}
                />
                {/* Campo Centavos - zero à esquerda automático */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Centavos</label>
                  <div className="relative">
                    {cong.extraCents !== null && cong.extraCents !== undefined && cong.extraCents !== 0 && (
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground pointer-events-none">R$ ***,</span>
                    )}
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="00"
                      className={`w-full h-10 rounded-md border border-input bg-background pr-3 text-sm ${cong.extraCents !== null && cong.extraCents !== undefined && cong.extraCents !== 0 ? 'pl-14' : 'pl-3'
                        }`}
                      value={cong.extraCents !== null && cong.extraCents !== undefined && cong.extraCents !== 0
                        ? (cong.extraCents < 10 ? `0${cong.extraCents}` : String(cong.extraCents))
                        : ''
                      }
                      onChange={e => {
                        // Remove tudo que não é dígito
                        let val = e.target.value.replace(/\D/g, '');

                        // Se começar com "0", pega só os últimos 2 dígitos
                        if (val.startsWith('0') && val.length > 1) {
                          val = val.slice(1);
                        }

                        // Limita a 2 dígitos
                        val = val.slice(0, 2);

                        // Atualiza o estado
                        updateCongregation(cong.id, 'extraCents', val ? Number(val) : null);
                      }}
                      onKeyDown={e => {
                        // Permite apenas números, backspace, delete, setas
                        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-3 border-t pt-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Regional (Financeiro)</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm cursor-pointer"
                    value={cong.regionalId || ''}
                    onChange={e => updateCongregation(cong.id, 'regionalId', e.target.value)}
                  >
                    {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cidade (Localização)</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm cursor-pointer"
                    value={cong.cityId || ''}
                    onChange={e => updateCongregation(cong.id, 'cityId', e.target.value)}
                    disabled={currentRegionalCities.length === 0}
                  >
                    {currentRegionalCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {currentRegionalCities.length === 0 && <option value="">Sem cidades nesta regional</option>}
                  </select>
                </div>
              </div>
              <TextField
                label="TXID Base (Automático)"
                value={txidBase}
                disabled
                description="Calculado automaticamente: Prefixo + Sufixo"
              />

              {/* Botão Salvar com feedback */}
              <div className="md:col-span-2 flex justify-end pt-3 border-t mt-2">
                <button
                  onClick={() => {
                    // Atualiza txidBase calculado no estado
                    updateCongregation(cong.id, 'txidBase', txidBase);
                    // Feedback visual
                    setSavedIds(prev => new Set(prev).add(cong.id));
                    setTimeout(() => {
                      setSavedIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(cong.id);
                        return newSet;
                      });
                    }, 2000);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${savedIds.has(cong.id)
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                >
                  {savedIds.has(cong.id) ? (
                    <>✓ Salvo com Sucesso!</>
                  ) : (
                    <>Salvar Igreja</>
                  )}
                </button>
              </div>
            </div>
          </AccordionItem>
        )
      })}
    </div>
  );

  const renderPurposes = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Finalidades</h3>
        <button onClick={handleAddPurpose} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16} /> Nova</button>
      </div>
      {domain.purposes.map(p => (
        <AccordionItem key={p.id} id={p.id} title={p.displayLabel} subtitle={p.txidSuffix} onDelete={id => domain.setPurposes(domain.purposes.filter(x => x.id !== id))} defaultOpen={p.name === 'Nova Coleta'}>
          <div className="grid grid-cols-2 gap-3 p-1">
            <TextField label="Nome Interno" value={p.name} onChange={e => updatePurpose(p.id, 'name', e.target.value.toUpperCase())} />
            <TextField label="Rótulo (Cartão)" value={p.displayLabel} onChange={e => { updatePurpose(p.id, 'displayLabel', e.target.value.toUpperCase()); updatePurpose(p.id, 'messageTemplate', e.target.value.toUpperCase()); }} />
            <TextField label="Sufixo TXID" value={p.txidSuffix} onChange={e => updatePurpose(p.id, 'txidSuffix', e.target.value.toUpperCase())} />
          </div>
        </AccordionItem>
      ))}
    </div>
  );

  // --- Helpers de Backup JSON ---
  const handleExportDomain = () => {
    const fullData = { states: domain.states, regionals: domain.regionals, cities: domain.cities, congregations: domain.congregations, banks: domain.banks, purposes: domain.purposes };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fullData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportDomain = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.regionals) domain.setRegionals(data.regionals);
        if (data.congregations) domain.setCongregations(data.congregations);
        if (data.purposes) domain.setPurposes(data.purposes);
        alert('Dados importados com sucesso!');
      } catch (err) { alert('Erro no arquivo JSON.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold">Base de Dados</h2>
          <p className="text-sm text-muted-foreground">Gerencie as igrejas, regionais e contas.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-xs border border-green-600 text-green-600 px-3 py-2 rounded hover:bg-green-50"><FileSpreadsheet size={16} /> Modelo CSV Lote</button>
          <input type="file" id="backup-upload" className="hidden" accept=".json" onChange={handleImportDomain} />
          <button onClick={() => document.getElementById('backup-upload')?.click()} className="flex items-center gap-2 text-xs border px-3 py-2 rounded hover:bg-secondary"><Upload size={16} /> Restaurar JSON</button>
          <button onClick={handleExportDomain} className="flex items-center gap-2 text-xs border px-3 py-2 rounded hover:bg-secondary"><Download size={16} /> Backup JSON</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-2">
        {['regionals', 'congregations', 'finalidades'].map(tab => (
          <button key={tab} onClick={() => setActiveSection(tab)} className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md ${activeSection === tab ? 'bg-secondary font-bold' : 'text-muted-foreground hover:bg-secondary/50'}`}>
            {tab === 'regionals' && 'Regionais & Contas'}
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