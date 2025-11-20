import React, { useState } from 'react';

// Componente de teste SUPER simples
export const TestInput = () => {
    const [value, setValue] = useState('');

    return (
        <div className="p-4 border border-red-500 rounded mb-4">
            <h3 className="font-bold text-red-600 mb-2">🧪 TESTE SIMPLES</h3>
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    console.log('🧪 TestInput onChange:', e.target.value);
                    setValue(e.target.value);
                }}
                className="border p-2 w-full"
                placeholder="Digite aqui para testar"
            />
            <p className="mt-2">Valor: {value}</p>
        </div>
    );
};
