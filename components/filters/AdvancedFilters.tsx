'use client';
import { Filter, X, ChevronDown, Check } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface AdvancedFiltersProps {
  filters: Record<string, string>;
  filterConfigs: FilterConfig[];
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  resultCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function AdvancedFilters({
  filters,
  filterConfigs,
  onFilterChange,
  onClearFilters,
  activeFiltersCount,
  resultCount,
  showFilters,
  onToggleFilters
}: AdvancedFiltersProps) {
  return (
    <div className="card">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleFilters}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <Filter size={18} />
              Filtros Avanzados
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-brand-600 text-white text-xs font-bold rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-enter">
            {filterConfigs.map((config) => (
              <div key={config.key} className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {config.label}
                </label>
                <Select.Root value={filters[config.key]} onValueChange={(value) => onFilterChange(config.key, value)}>
                  <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-colors">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown size={16} className="text-slate-500 dark:text-slate-400" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                      <Select.Viewport className="p-1">
                        {config.options.map((option) => (
                          <Select.Item
                            key={option.value}
                            value={option.value}
                            className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-600"
                          >
                            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                              <Check size={14} />
                            </Select.ItemIndicator>
                            <Select.ItemText>{option.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            ))}
          </div>
        )}

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {filterConfigs.map((config) => {
              if (filters[config.key] === 'TODOS') return null;
              const selectedOption = config.options.find(opt => opt.value === filters[config.key]);
              return (
                <span key={config.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                  {config.label}: {selectedOption?.label}
                  <button
                    onClick={() => onFilterChange(config.key, 'TODOS')}
                    className="hover:text-blue-900 dark:hover:text-blue-100 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
