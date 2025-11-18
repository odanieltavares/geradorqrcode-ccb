import React, { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { 
  State, Regional, City, Congregation, Bank, PixPurpose 
} from '../domain/types';
import * as seeds from '../domain/mockData';

interface DomainContextType {
  states: State[]; setStates: (v: State[]) => void;
  regionals: Regional[]; setRegionals: (v: Regional[]) => void;
  cities: City[]; setCities: (v: City[]) => void;
  congregations: Congregation[]; setCongregations: (v: Congregation[]) => void;
  banks: Bank[]; setBanks: (v: Bank[]) => void;
  // Removido: pixKeys, identifiers, purposes
  purposes: PixPurpose[]; setPurposes: (v: PixPurpose[]) => void;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export const DomainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializa com seed data se localStorage estiver vazio
  const [states, setStates] = useLocalStorage<State[]>('dom_states', seeds.initialStates);
  const [regionals, setRegionals] = useLocalStorage<Regional[]>('dom_regionals', seeds.initialRegionals);
  const [cities, setCities] = useLocalStorage<City[]>('dom_cities', seeds.initialCities);
  const [congregations, setCongregations] = useLocalStorage<Congregation[]>('dom_congregations', seeds.initialCongregations);
  const [banks, setBanks] = useLocalStorage<Bank[]>('dom_banks', seeds.initialBanks);
  const [purposes, setPurposes] = useLocalStorage<PixPurpose[]>('dom_purposes', seeds.initialPurposes);

  return (
    <DomainContext.Provider value={{
      states, setStates,
      regionals, setRegionals,
      cities, setCities,
      congregations, setCongregations,
      banks, setBanks,
      purposes, setPurposes,
    }}>
      {children}
    </DomainContext.Provider>
  );
};

export const useDomain = () => {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
};