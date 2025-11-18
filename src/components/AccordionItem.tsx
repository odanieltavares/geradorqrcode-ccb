import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, Trash2, Edit } from 'lucide-react';

interface AccordionItemProps {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onDelete: (id: string) => void;
  onPreview?: (id: string) => void;
  defaultOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  title,
  subtitle,
  children,
  onDelete,
  onPreview,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm">
      <div
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isOpen ? 'bg-secondary/30' : 'hover:bg-secondary/10'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-muted-foreground" />}
          <div>
            <span className="font-semibold text-foreground">{title}</span>
            {subtitle && <span className="text-xs text-muted-foreground ml-2">{subtitle}</span>}
        </div>
        </div>
        <div className="flex items-center gap-2">
            {onPreview && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(id); }}
                    className="p-1 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    title="Visualizar no Card Preview"
                >
                    <Eye size={18} />
                </button>
            )}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                className="p-1 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                title="Remover"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionItem;