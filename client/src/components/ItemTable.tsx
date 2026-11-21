import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  HelpCircle,
} from 'lucide-react';
import { UniqueCategory, UniqueItem, PriceMode } from '../services/types.js';

export type SortField = 'name' | 'baseType' | 'category' | 'chaosValue' | 'divineValue' | 'listingCount';
export type SortDirection = 'asc' | 'desc';

interface ItemTableProps {
  items: UniqueItem[];
  selectedItemIds: Set<string>;
  onToggleItem: (item: UniqueItem) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  priceMode: PriceMode;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalFilteredCount: number;
}

const CATEGORY_COLORS: Record<UniqueCategory, string> = {
  Weapon: 'text-red-400 bg-red-950/40 border-red-800/40',
  Armour: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
  Accessory: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
  Flask: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
  Jewel: 'text-purple-400 bg-purple-950/40 border-purple-800/40',
  Tincture: 'text-teal-400 bg-teal-950/40 border-teal-800/40',
  'Divination Card': 'text-cyan-300 bg-cyan-950/40 border-cyan-800/40',
};

export const ItemTable: React.FC<ItemTableProps> = ({
  items,
  selectedItemIds,
  onToggleItem,
  sortField,
  sortDirection,
  onSort,
  priceMode,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalFilteredCount,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFilteredCount);
  const visibleItems = items.slice(startIndex, endIndex);

  // Check if all visible items are selected
  const allVisibleSelected =
    visibleItems.length > 0 &&
    visibleItems.every((item) => selectedItemIds.has(item.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      // Deselect all visible
      visibleItems.forEach((item) => {
        if (selectedItemIds.has(item.id)) {
          onToggleItem(item);
        }
      });
    } else {
      // Select all visible
      visibleItems.forEach((item) => {
        if (!selectedItemIds.has(item.id)) {
          onToggleItem(item);
        }
      });
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-arpg-muted/50 inline ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-poe-unique-bright inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-poe-unique-bright inline ml-1" />
    );
  };

  return (
    <div className="bg-arpg-panel rounded-xl border border-arpg-border overflow-hidden shadow-xl flex flex-col">
      {/* Table Container with horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-arpg-darkest border-b border-arpg-border text-arpg-muted font-medium select-none">
              {/* Checkbox column */}
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="rounded border-arpg-border bg-arpg-panel text-poe-unique focus:ring-poe-unique cursor-pointer"
                  title="Select / deselect all visible on this page"
                />
              </th>

              {/* Icon */}
              <th className="p-3 w-12 text-center">Icon</th>

              {/* Item Name */}
              <th
                onClick={() => onSort('name')}
                className="p-3 font-semibold text-arpg-text cursor-pointer hover:text-poe-unique-bright transition-colors"
              >
                <span>Item Name</span>
                {renderSortIcon('name')}
              </th>

              {/* Base Type */}
              <th
                onClick={() => onSort('baseType')}
                className="p-3 cursor-pointer hover:text-poe-unique-bright transition-colors hidden sm:table-cell"
              >
                <span>Base Type</span>
                {renderSortIcon('baseType')}
              </th>

              {/* Category */}
              <th
                onClick={() => onSort('category')}
                className="p-3 cursor-pointer hover:text-poe-unique-bright transition-colors"
              >
                <span>Category</span>
                {renderSortIcon('category')}
              </th>

              {/* Chaos Value */}
              <th
                onClick={() => onSort('chaosValue')}
                className="p-3 text-right cursor-pointer hover:text-poe-unique-bright transition-colors"
                title={`Sorted by ${priceMode === 'total' ? 'Total Set / Stack Price' : priceMode === 'ultimatum' ? 'Ultimatum Sacrifice Price' : 'Unit Price (1x)'}`}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Chaos Value</span>
                  <span className="text-[10px] font-normal text-cyan-400">
                    ({priceMode === 'total' ? 'Total' : priceMode === 'ultimatum' ? 'Ulti' : '1x'})
                  </span>
                  {renderSortIcon('chaosValue')}
                </div>
              </th>

              {/* Divine Value */}
              <th
                onClick={() => onSort('divineValue')}
                className="p-3 text-right cursor-pointer hover:text-poe-unique-bright transition-colors hidden md:table-cell"
                title={`Sorted by ${priceMode === 'total' ? 'Total Set / Stack Price' : priceMode === 'ultimatum' ? 'Ultimatum Sacrifice Price' : 'Unit Price (1x)'}`}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Divine Value</span>
                  <span className="text-[10px] font-normal text-cyan-400">
                    ({priceMode === 'total' ? 'Total' : priceMode === 'ultimatum' ? 'Ulti' : '1x'})
                  </span>
                  {renderSortIcon('divineValue')}
                </div>
              </th>

              {/* Listings */}
              <th
                onClick={() => onSort('listingCount')}
                className="p-3 text-right cursor-pointer hover:text-poe-unique-bright transition-colors hidden lg:table-cell"
              >
                <span>Listings</span>
                {renderSortIcon('listingCount')}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-arpg-border/40">
            {visibleItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-arpg-muted">
                  No items match your current filter settings.
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id);
                const isCard = item.category === 'Divination Card';

                return (
                  <tr
                    key={item.id}
                    onClick={() => onToggleItem(item)}
                    className={`transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-amber-950/20 hover:bg-amber-950/30'
                        : 'hover:bg-arpg-surface/70'
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="p-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleItem(item)}
                        className="rounded border-arpg-border bg-arpg-panel text-poe-unique focus:ring-poe-unique cursor-pointer"
                      />
                    </td>

                    {/* Icon */}
                    <td className="p-2 text-center">
                      <div className="w-9 h-9 rounded bg-arpg-darkest border border-arpg-border/80 flex items-center justify-center overflow-hidden mx-auto">
                        {item.icon ? (
                          <img
                            src={item.icon}
                            alt={item.name}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <HelpCircle className="w-4 h-4 text-arpg-muted" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-sm ${
                            isCard
                              ? 'text-cyan-300'
                              : isSelected
                              ? 'text-poe-unique-bright'
                              : 'text-poe-unique'
                          }`}
                        >
                          {item.name}
                        </span>

                        {item.isReplica && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            REPLICA
                          </span>
                        )}

                        {item.variantCount > 1 && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] bg-arpg-darkest text-arpg-muted border border-arpg-border"
                            title={`${item.variantCount} price variants found on poe.ninja (lowest baseline shown)`}
                          >
                            {item.variantCount} vars
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Base Type */}
                    <td className="p-3 text-arpg-muted hidden sm:table-cell">
                      {item.baseType}
                    </td>

                    {/* Category Badge */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          CATEGORY_COLORS[item.category] || 'text-arpg-muted'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* Chaos Value */}
                    <td className="p-3 text-right">
                      {isCard ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="font-mono font-bold text-amber-300 flex items-center justify-end gap-1.5">
                            <span>
                              {priceMode === 'total'
                                ? (item.totalChaosValue ?? Math.round(item.chaosValue * (item.stackSize || 1) * 10) / 10).toLocaleString()
                                : priceMode === 'ultimatum'
                                ? (item.ultimatumChaosValue ?? Math.round(item.chaosValue * (item.ultimatumQuantity || 1) * 10) / 10).toLocaleString()
                                : item.chaosValue.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-poe-chaos font-normal">c</span>
                            <span
                              className={`px-1 py-0.2 rounded text-[10px] font-semibold ${
                                priceMode === 'total'
                                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                                  : priceMode === 'ultimatum'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                  : 'bg-arpg-darkest text-arpg-muted border border-arpg-border'
                              }`}
                            >
                              {priceMode === 'total'
                                ? `${item.stackSize || 1}x set`
                                : priceMode === 'ultimatum'
                                ? `${item.ultimatumQuantity || 1}x ulti`
                                : '1x ea'}
                            </span>
                          </div>
                          <div className="text-[10px] text-arpg-muted flex items-center gap-1 font-mono">
                            {priceMode === 'total' ? (
                              <span>1x: {item.chaosValue}c · Ulti: ~{item.ultimatumChaosValue ?? Math.round(item.chaosValue * (item.ultimatumQuantity || 1) * 10) / 10}c</span>
                            ) : priceMode === 'ultimatum' ? (
                              <span>1x: {item.chaosValue}c · Set: {item.totalChaosValue ?? Math.round(item.chaosValue * (item.stackSize || 1) * 10) / 10}c</span>
                            ) : (
                              <span>Set ({item.stackSize || 1}x): {item.totalChaosValue ?? Math.round(item.chaosValue * (item.stackSize || 1) * 10) / 10}c</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="font-mono font-bold text-amber-300 flex items-center justify-end gap-1">
                          <span>{item.chaosValue.toLocaleString()}</span>
                          <span className="text-[10px] text-poe-chaos font-normal">c</span>
                        </div>
                      )}
                    </td>

                    {/* Divine Value */}
                    <td className="p-3 text-right hidden md:table-cell">
                      {isCard ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="font-mono text-amber-200/90 flex items-center justify-end gap-1">
                            <span>
                              {(() => {
                                const val =
                                  priceMode === 'total'
                                    ? item.totalDivineValue ?? Math.round(item.divineValue * (item.stackSize || 1) * 100) / 100
                                    : priceMode === 'ultimatum'
                                    ? item.ultimatumDivineValue ?? Math.round(item.divineValue * (item.ultimatumQuantity || 1) * 100) / 100
                                    : item.divineValue;
                                return val > 0 ? val.toFixed(2) : '< 0.01';
                              })()}
                            </span>
                            <span className="text-[10px] text-poe-divine font-normal">div</span>
                          </div>
                          <div className="text-[10px] text-arpg-muted font-mono">
                            {priceMode === 'unit' ? (
                              <span>Set: {item.totalDivineValue && item.totalDivineValue > 0 ? `${item.totalDivineValue.toFixed(2)}d` : '<0.01d'}</span>
                            ) : (
                              <span>1x: {item.divineValue > 0 ? `${item.divineValue.toFixed(2)}d` : '<0.01d'}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="font-mono text-amber-200/90 flex items-center justify-end gap-1">
                          <span>
                            {item.divineValue > 0 ? item.divineValue.toFixed(2) : '< 0.01'}
                          </span>
                          <span className="text-[10px] text-poe-divine font-normal">div</span>
                        </div>
                      )}
                    </td>

                    {/* Listing Count */}
                    <td className="p-3 text-right text-arpg-muted hidden lg:table-cell font-mono">
                      {item.listingCount > 0 ? item.listingCount.toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-3 bg-arpg-darkest border-t border-arpg-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-arpg-muted">
        {/* Info */}
        <div>
          Showing{' '}
          <strong className="text-arpg-text">
            {totalFilteredCount === 0 ? 0 : startIndex + 1}
          </strong>{' '}
          to{' '}
          <strong className="text-arpg-text">{endIndex}</strong> of{' '}
          <strong className="text-arpg-text">
            {totalFilteredCount.toLocaleString()}
          </strong>{' '}
          items
        </div>

        {/* Page size + Navigation */}
        <div className="flex items-center gap-3">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-arpg-panel text-arpg-text rounded px-2 py-1 border border-arpg-border hover:border-poe-unique/50 cursor-pointer outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
              className="px-2 py-1 rounded bg-arpg-panel border border-arpg-border hover:bg-arpg-surface text-arpg-text disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title="First Page"
            >
              &laquo;
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded bg-arpg-panel border border-arpg-border hover:bg-arpg-surface text-arpg-text disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Prev
            </button>

            <span className="px-2 font-mono text-arpg-text">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded bg-arpg-panel border border-arpg-border hover:bg-arpg-surface text-arpg-text disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded bg-arpg-panel border border-arpg-border hover:bg-arpg-surface text-arpg-text disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title="Last Page"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
