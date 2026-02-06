'use client';

import { LayoutGrid, List, Network } from 'lucide-react';

export type DepartmentViewType = 'card' | 'table' | 'org-structure';

interface DepartmentViewSwitcherProps {
  currentView: DepartmentViewType;
  onViewChange: (view: DepartmentViewType) => void;
}

export default function DepartmentViewSwitcher({ currentView, onViewChange }: DepartmentViewSwitcherProps) {
  const views = [
    { id: 'card' as DepartmentViewType, icon: LayoutGrid, label: 'Cards' },
    { id: 'table' as DepartmentViewType, icon: List, label: 'Table' },
    { id: 'org-structure' as DepartmentViewType, icon: Network, label: 'Org Chart' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.id;
        
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${isActive 
                ? 'bg-white text-brandBlue shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }
            `}
            title={view.label}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
