import React from 'react';
import {
  Search,
  X,
  Shield,
  Sword,
  Gem,
  FlaskConical,
  CircleDot,
  Sparkles,
  CheckSquare,
  Square,
  DollarSign,
} from 'lucide-react';
import { UniqueCategory } from '../services/types.js';

interface FilterControlsProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: UniqueCategory | 'All';
  onCategoryChange: (cat: UniqueCategory | 'All') => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  priceCurrency: 'chaos' | 'divine';
  onCurrencyChange: (curr: 'chaos' | 'divine') => void;
  replicaFilter: 'all' | 'no-replicas' | 'replicas-only';
  onReplicaFilterChange: (val: 'all' | 'no-replicas' | 'replicas-only') => void;
  categoryCounts: Record<string, number>;
  filteredCount: number;
  totalCount: number;
  allFilteredSelected: boolean;
  onToggleSelectAllFiltered: () => void;
  onApplyPreset: (min: string, max: string, curr: 'chaos' | 'divine') => void;
  onResetFilters: () => void;
}

const CATEGORIES: Array<{
  id: UniqueCategory | 'All';
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'All', label: 'All', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'Weapon', label: 'Weapons', icon: <Sword className="w-3.5 h-3.5" /> },
  { id: 'Armour', label: 'Armour', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'Accessory', label: 'Accessories', icon: <CircleDot className="w-3.5 h-3.5" /> },
  { id: 'Flask', label: 'Flasks', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: 'Jewel', label: 'Jewels', icon: <Gem className="w-3.5 h-3.5" /> },
  { id: 'Tincture', label: 'Tinctures', icon: <FlaskConical className="w-3.5 h-3.5" /> },
];

export const FilterControls: React.FC<FilterControlsProps> = ({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  priceCurrency,
  onCurrencyChange,
  replicaFilter,
  onReplicaFilterChange,
  categoryCounts,
  filteredCount,
  allFilteredSelected,
  onToggleSelectAllFiltered,
  onApplyPreset,
  onResetFilters,
}) => {
  return (
    <div className="bg-arpg-panel rounded-xl border border-arpg-border p-4 space-y-4 shadow-lg">
      {/* Top row: Instant Search + Bulk Selection Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-arpg-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by unique item name or base type (e.g. Tabula Rasa, Leather Belt, Opal Ring)..."
            className="w-full pl-9 pr-9 py-2 rounded-lg arpg-input text-sm placeholder:text-arpg-muted/70"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-arpg-muted hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bulk Selection Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSelectAllFiltered}
            disabled={filteredCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
              allFilteredSelected
                ? 'bg-amber-900/40 text-poe-gold-light border border-poe-gold/50 hover:bg-amber-900/60'
                : 'bg-gradient-to-r from-poe-unique/80 to-amber-700/80 hover:from-poe-unique hover:to-amber-600 text-white shadow-glow-orange border border-poe-unique-bright/40'
            }`}
          >
            {allFilteredSelected ? (
              <>
                <Square className="w-4 h-4 text-poe-gold" />
                <span>Deselect All Filtered ({filteredCount.toLocaleString()})</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 text-white" />
                <span>Select All Filtered ({filteredCount.toLocaleString()})</span>
              </>
            )}
          </button>

          <button
            onClick={onResetFilters}
            title="Reset all search and price filters"
            className="px-3 py-2 rounded-lg bg-arpg-darkest hover:bg-arpg-surface text-arpg-muted hover:text-white border border-arpg-border text-xs font-medium transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Middle row: Category chips + Replica selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-arpg-border/60">
        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] ?? 0;
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-poe-unique text-white border border-poe-unique-bright shadow-sm'
                    : 'bg-arpg-darkest text-arpg-muted hover:text-white hover:bg-arpg-surface border border-arpg-border'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black/30 text-white' : 'bg-arpg-panel text-arpg-muted'
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Replica Filter */}
        <div className="flex items-center gap-1 bg-arpg-darkest p-1 rounded-lg border border-arpg-border text-xs">
          <span className="text-arpg-muted px-2 text-[11px]">Replicas:</span>
          <button
            onClick={() => onReplicaFilterChange('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
              replicaFilter === 'all'
                ? 'bg-arpg-surface text-poe-gold-light'
                : 'text-arpg-muted hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onReplicaFilterChange('no-replicas')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
              replicaFilter === 'no-replicas'
                ? 'bg-arpg-surface text-poe-gold-light'
                : 'text-arpg-muted hover:text-white'
            }`}
          >
            Exclude
          </button>
          <button
            onClick={() => onReplicaFilterChange('replicas-only')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
              replicaFilter === 'replicas-only'
                ? 'bg-arpg-surface text-poe-gold-light'
                : 'text-arpg-muted hover:text-white'
            }`}
          >
            Only
          </button>
        </div>
      </div>

      {/* Bottom row: Price Range Filter & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-arpg-border/60 text-xs">
        {/* Min / Max inputs with Currency Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-arpg-muted font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-poe-gold" />
            <span>Price Range:</span>
          </span>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="any"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              placeholder="Min"
              className="w-20 px-2.5 py-1 rounded arpg-input text-xs"
            />
            <span className="text-arpg-muted">to</span>
            <input
              type="number"
              min="0"
              step="any"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              placeholder="Max"
              className="w-20 px-2.5 py-1 rounded arpg-input text-xs"
            />
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center bg-arpg-darkest p-0.5 rounded border border-arpg-border text-[11px]">
            <button
              onClick={() => onCurrencyChange('chaos')}
              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                priceCurrency === 'chaos'
                  ? 'bg-poe-chaos/30 text-amber-300 font-bold border border-poe-chaos/50'
                  : 'text-arpg-muted hover:text-white'
              }`}
            >
              Chaos (c)
            </button>
            <button
              onClick={() => onCurrencyChange('divine')}
              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                priceCurrency === 'divine'
                  ? 'bg-poe-divine/30 text-amber-200 font-bold border border-poe-divine/50'
                  : 'text-arpg-muted hover:text-white'
              }`}
            >
              Divine (div)
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-arpg-muted text-[11px]">Quick Presets:</span>
          <button
            onClick={() => onApplyPreset('1', '5', 'chaos')}
            className="px-2.5 py-1 rounded bg-arpg-darkest hover:bg-arpg-surface text-poe-chaos border border-arpg-border hover:border-poe-chaos/50 text-[11px] font-medium transition-all cursor-pointer"
            title="Great for cheap Inscribed Ultimatum sacrifices"
          >
            Cheap Sacrifices (1–5c)
          </button>
          <button
            onClick={() => onApplyPreset('5', '20', 'chaos')}
            className="px-2.5 py-1 rounded bg-arpg-darkest hover:bg-arpg-surface text-amber-300 border border-arpg-border hover:border-amber-400/50 text-[11px] font-medium transition-all cursor-pointer"
          >
            Mid (5–20c)
          </button>
          <button
            onClick={() => onApplyPreset('50', '', 'chaos')}
            className="px-2.5 py-1 rounded bg-arpg-darkest hover:bg-arpg-surface text-poe-unique-bright border border-arpg-border hover:border-poe-unique/50 text-[11px] font-medium transition-all cursor-pointer"
            title="High-value rewards (50c+)"
          >
            Valuable (50c+)
          </button>
          <button
            onClick={() => onApplyPreset('1', '', 'divine')}
            className="px-2.5 py-1 rounded bg-arpg-darkest hover:bg-arpg-surface text-poe-divine border border-arpg-border hover:border-poe-divine/50 text-[11px] font-medium transition-all cursor-pointer"
          >
            1+ Divine
          </button>
        </div>
      </div>
    </div>
  );
};
