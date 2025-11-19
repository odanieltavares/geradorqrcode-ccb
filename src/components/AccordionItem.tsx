import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Eye } from 'lucide-react';

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
    <div className="border border-border rounded-lg bg-card shadow-sm mb-3 transition-all duration-200 hover:shadow-md">
      <div
        className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${
          isOpen ? 'bg-secondary/40 border-b border-border' : 'hover:bg-secondary/20'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {isOpen ? (
            <ChevronDown size={18} className="text-primary flex-shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          )}
          <div className="truncate">
            <span className="font-semibold text-foreground block truncate">{title}</span>
            {subtitle && (
              <span className="text-xs text-muted-foreground truncate block">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 pl-2">
            {onPreview && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(id); }}
                    className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    title="Visualizar"
                >
                    <Eye size={18} />
                </button>
            )}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Excluir"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionItem;