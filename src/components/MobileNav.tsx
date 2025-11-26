import React from 'react';
import { Home, Search, PieChart, Clock, User, Clock10, Settings, Settings2Icon, BookTemplate, LayoutTemplate, Database, GalleryHorizontalEnd, GalleryVerticalEnd, FolderDot, SquareDashedKanban, ScanQrCode, QrCode, ScanLine, Ticket, SquaresUnite } from 'lucide-react';

interface MobileNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'individual', label: 'Individual', icon: SquaresUnite },
        { id: 'batch', label: 'Em Lote', icon: GalleryVerticalEnd },
        { id: 'admin', label: 'Admin', icon: FolderDot },
        { id: 'templates', label: 'Templates', icon: ScanLine },
        { id: 'profile', label: 'Perfil', icon: User },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Background com blur */}
            <div className="absolute inset-0 bg-background/95 backdrop-blur-lg border-t border-border/40" />

            {/* Content */}
            <div className="relative flex justify-around items-center h-20 px-2 pb-safe">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all duration-300 ease-out relative"
                        >
                            {/* Indicador superior - pill/barra */}
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
                            )}

                            {/* Ícone */}
                            <Icon
                                size={24}
                                strokeWidth={1.5}
                                className={`transition-all duration-300 ${isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground/60'
                                    }`}
                            />

                            {/* Label */}
                            <span className={`
                text-[10px] font-medium transition-all duration-300
                ${isActive
                                    ? 'text-primary font-semibold'
                                    : 'text-muted-foreground/60'
                                }
              `}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
