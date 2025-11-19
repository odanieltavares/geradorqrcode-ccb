import React from 'react';
import { Template } from '../types';
import { Check } from 'lucide-react';

interface PresetsTabProps {
  templates: Template[];
  selectedTemplate: Template;
  onSelectTemplate: (template: Template) => void;
}

const PresetsTab: React.FC<PresetsTabProps> = ({ templates, selectedTemplate, onSelectTemplate }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold">Selecionar Template</h2>
      <p className="text-sm text-muted-foreground mb-4">Escolha o layout visual do cartão.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map(template => {
          const isSelected = selectedTemplate.id === template.id;
          return (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`cursor-pointer relative rounded-lg border-2 p-4 transition-all duration-200 ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-lg' 
                  : 'border-border hover:border-primary/50 hover:shadow-sm'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                    <Check size={12} />
                </div>
              )}
              <h3 className={`font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {template.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">Versão: {template.version}</p>
              
              {/* Mini Preview Abstrato Visual */}
              <div className="mt-3 h-24 bg-background border rounded flex flex-col items-center justify-center text-xs text-muted-foreground overflow-hidden relative opacity-60">
                  <div className="w-full h-2 bg-zinc-200 absolute top-2"></div>
                  <div className="w-12 h-12 border-2 border-zinc-300 rounded flex items-center justify-center mb-1">
                      QR
                  </div>
                  <div className="w-3/4 h-1 bg-zinc-200 rounded"></div>
                  <div className="w-1/2 h-1 bg-zinc-200 rounded mt-1"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PresetsTab;