import React, { useEffect, useState } from 'react';
import { useDomain } from '../context/DomainContext';
import { ResolvedPixProfile } from '../domain/types';
import { resolveProfile } from '../utils/domainMapper';

interface HierarchySelectorProps {
  onProfileResolved: (profile: ResolvedPixProfile | null) => void;
}

const HierarchySelector: React.FC<HierarchySelectorProps> = ({ onProfileResolved }) => {
  const domain = useDomain();

  const [regionalId, setRegionalId] = useState('');
  const [cityId, setCityId] = useState('');
  const [congregationId, setCongregationId] = useState('');
  const [purposeId, setPurposeId] = useState('');

  // Cascading resets
  useEffect(() => { setCityId(''); }, [regionalId]);
  useEffect(() => { setCongregationId(''); }, [cityId]);
  useEffect(() => { setPurposeId(''); }, [congregationId]);

  // Effect to resolve profile when everything is selected
  useEffect(() => {
    if (regionalId && cityId && congregationId && purposeId) {
      // Busca o estado da regional para passar para resolveProfile
      const regional = domain.regionals.find(r => r.id === regionalId);
      const stateId = regional?.stateId || '';

      const profile = resolveProfile(stateId, regionalId, cityId, congregationId, purposeId, domain);
      onProfileResolved(profile);
    } else {
      onProfileResolved(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionalId, cityId, congregationId, purposeId]);

  // Filtering options
  const filteredCities = domain.cities.filter(c => c.regionalId === regionalId);
  const filteredCongregations = domain.congregations.filter(c => c.cityId === cityId && c.regionalId === regionalId);
  const availablePurposes = domain.purposes.filter(p => p.active);

  const selectClass = "w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-secondary/30 rounded-lg border border-border/50">
      <div>
        <label className="block text-xs font-medium mb-1">1. Regional (Financeiro)</label>
        <select value={regionalId} onChange={e => setRegionalId(e.target.value)} className={selectClass}>
          <option value="">Selecione...</option>
          {domain.regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">2. Cidade (Localização)</label>
        <select value={cityId} onChange={e => setCityId(e.target.value)} className={selectClass} disabled={!regionalId}>
          <option value="">Selecione...</option>
          {filteredCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">3. Igreja (Comum)</label>
        <select value={congregationId} onChange={e => setCongregationId(e.target.value)} className={selectClass} disabled={!cityId}>
          <option value="">Selecione...</option>
          {filteredCongregations.length === 0 && cityId && <option value="" disabled>Nenhuma igreja nesta cidade/regional</option>}
          {filteredCongregations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">4. Finalidade (Tipo de Coleta)</label>
        <select value={purposeId} onChange={e => setPurposeId(e.target.value)} className={selectClass} disabled={!congregationId}>
          <option value="">Selecione...</option>
          {availablePurposes.map(p => <option key={p.id} value={p.id}>{p.displayLabel}</option>)}
        </select>
      </div>
    </div>
  );
};

export default HierarchySelector;