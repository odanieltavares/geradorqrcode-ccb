
import React from 'react';
import { Template } from '../types';

interface TemplatesTabProps {
  templates: Template[];
  selectedTemplate: Template;
  onSelectTemplate: (template: Template) => void;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ templates, selectedTemplate, onSelectTemplate }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold">Selecionar Template</h2>
      <p className="text-sm text-muted-foreground mb-4">Escolha o layout do cartão a ser gerado.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map(template => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              selectedTemplate.id === template.id ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50'
            }`}
          >
            <h3 className="font-semibold text-foreground">{template.name}</h3>
            <p className="text-xs text-muted-foreground">Versão: {template.version}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatesTab;
