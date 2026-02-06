'use client';

import { X } from 'lucide-react';

export interface QuickFilter {
  id: string;
  label: string;
  filter: {
    departments?: string[];
    positions?: string[];
    statuses?: string[];
    dateRange?: { from?: string; to?: string };
  };
}

interface QuickFilterChipsProps {
  onFilterSelect: (filter: QuickFilter['filter']) => void;
  activeFilters?: string[];
}

export default function QuickFilterChips({ onFilterSelect, activeFilters = [] }: QuickFilterChipsProps) {
  const quickFilters: QuickFilter[] = [
    {
      id: 'new-hires',
      label: 'New Hires (30 days)',
      filter: {
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      },
    },
    {
      id: 'active-only',
      label: 'Active Only',
      filter: {
        statuses: ['ACTIVE'],
      },
    },
    {
      id: 'on-leave',
      label: 'On Leave',
      filter: {
        statuses: ['ON_LEAVE'],
      },
    },
    {
      id: 'probation',
      label: 'Probation Period',
      filter: {
        dateRange: {
          from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        statuses: ['ACTIVE'],
      },
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Quick Filters:
      </span>
      {quickFilters.map((qf) => {
        const isActive = activeFilters.includes(qf.id);
        
        return (
          <button
            key={qf.id}
            onClick={() => onFilterSelect(qf.filter)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${isActive
                ? 'bg-brandBlue text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
            `}
          >
            {qf.label}
            {isActive && <X size={12} />}
          </button>
        );
      })}
    </div>
  );
}
