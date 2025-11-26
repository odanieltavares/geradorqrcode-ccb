import { useState } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (typeof window !== 'undefined') {
                const serialized = JSON.stringify(valueToStore);

                // CORREÇÃO CRÍTICA #3: Verificar tamanho antes de salvar (limite ~4.5MB)
                const sizeInMB = serialized.length / (1024 * 1024);
                if (sizeInMB > 4.5) {
                    console.warn(`⚠️ Dados muito grandes (${sizeInMB.toFixed(2)}MB). Considere limpar dados antigos.`);
                }

                try {
                    window.localStorage.setItem(key, serialized);
                } catch (storageError: any) {
                    // CORREÇÃO CRÍTICA #3: Tratamento específico de QuotaExceededError
                    if (storageError.name === 'QuotaExceededError') {
                        alert(
                            '❌ Armazenamento local cheio!\n\n' +
                            'O navegador atingiu o limite de armazenamento.\n' +
                            'Vá em "Administração" e exporte um backup, depois limpe os dados antigos.'
                        );
                        console.error('QuotaExceededError: localStorage cheio. Tamanho tentado:', sizeInMB.toFixed(2), 'MB');
                    } else {
                        throw storageError;
                    }
                }
            }
        } catch (error) {
            console.error(`Erro ao salvar ${key}:`, error);
        }
    };

    return [storedValue, setValue];
}

export default useLocalStorage;
