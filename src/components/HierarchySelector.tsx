import React, { useEffect, useState } from 'react';
import { useDomain } from '../context/DomainContext';
import { ResolvedPixProfile } from '../domain/types';
import { resolveProfile } from '../utils/domainMapper';

interface HierarchySelectorProps {
  onProfileResolved: (profile: ResolvedPixProfile | null) => void;
}

const HierarchySelector: React.FC<HierarchySelectorProps> = ({ onProfileResolved }) => {
  const domain = useDomain();
  
  const [stateId, setStateId] = useState('');
  const [regionalId, setRegionalId] = useState('');
  const [cityId, setCityId] = useState('');
  const [congregationId, setCongregationId] = useState('');
  const [purposeId, setPurposeId] = useState('');

  // Cascading resets
  useEffect(() => { setRegionalId(''); }, [stateId]);
  useEffect(() => { setCityId(''); }, [regionalId]);
  useEffect(() => { setCongregationId(''); }, [cityId]);
  useEffect(() => { setPurposeId(''); }, [congregationId]);

  // Resolver perfil completo
  useEffect(() => {
    if (stateId && regionalId && cityId && congregationId && purposeId) {
      const profile = resolveProfile(stateId, regionalId, cityId, congregationId, purposeId, domain);
      onProfileResolved(profile);
    } else {
      onProfileResolved(null);
    }
  }, [stateId, regionalId, cityId, congregationId, purposeId, domain, onProfileResolved]);

  // Filtros
  const filteredRegionals = domain.regionals.filter(r => r.stateId === stateId);
  const filteredCities = domain.cities.filter(c => c.regionalId === regionalId);
  const filteredCongregations = domain.congregations.filter(c => c.cityId === cityId);
  
  // Filtragem complexa: Identificadores da congregação -> Finalidades desses identificadores
  const availableIdentifiers = domain.identifiers.filter(i => i.congregationId === congregationId);
  const availablePurposes = domain.purposes.filter(p => availableIdentifiers.some(i => i.id === p.pixIdentifierId));

  const selectClass = "w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-secondary/30 rounded-lg border border-border/50">
      <div>
        <label className="block text-xs font-medium mb-1">1. Estado</label>
        <select value={stateId} onChange={e => setStateId(e.target.value)} className={selectClass}>
          <option value="">Selecione...</option>
          {domain.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">2. Regional</label>
        <select value={regionalId} onChange={e => setRegionalId(e.target.value)} className={selectClass} disabled={!stateId}>
           <option value="">Selecione...</option>
           {filteredRegionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">3. Cidade</label>
        <select value={cityId} onChange={e => setCityId(e.target.value)} className={selectClass} disabled={!regionalId}>
           <option value="">Selecione...</option>
           {filteredCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">4. Igreja (Comum)</label>
        <select value={congregationId} onChange={e => setCongregationId(e.target.value)} className={selectClass} disabled={!cityId}>
           <option value="">Selecione...</option>
           {filteredCongregations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-xs font-medium mb-1">5. Finalidade (Tipo de Coleta)</label>
        <select value={purposeId} onChange={e => setPurposeId(e.target.value)} className={selectClass} disabled={!congregationId}>
           <option value="">Selecione...</option>
           {availablePurposes.length === 0 && congregationId && <option value="" disabled>Nenhuma finalidade cadastrada para esta igreja</option>}
           {availablePurposes.map(p => <option key={p.id} value={p.id}>{p.displayLabel}</option>)}
        </select>
      </div>
    </div>
  );
};

export default HierarchySelector;