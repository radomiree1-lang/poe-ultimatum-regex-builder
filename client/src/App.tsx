import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header.js';
import { RegexBar } from './components/RegexBar.js';
import { FilterControls } from './components/FilterControls.js';
import { ItemTable, SortDirection, SortField } from './components/ItemTable.js';
import { RegexTesterModal } from './components/RegexTesterModal.js';
import { fetchLeagues, fetchUniques } from './services/api.js';
import {
  CompressionMode,
  LeagueInfo,
  MatchMode,
  PrefixMode,
  UniqueCategory,
  UniqueItem,
} from './services/types.js';
import { generateRegexChunks } from './services/regexEngine.js';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  // Leagues state
  const [leagues, setLeagues] = useState<LeagueInfo[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('Standard');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [ageSeconds, setAgeSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Items data
  const [items, setItems] = useState<UniqueItem[]>([]);

  // Selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Regex Engine configuration
  const [matchMode, setMatchMode] = useState<MatchMode>('reward');
  const [prefixMode, setPrefixMode] = useState<PrefixMode>('standard');
  const [compressionMode, setCompressionMode] = useState<CompressionMode>('full');

  // Filter state
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<UniqueCategory | 'All'>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [priceCurrency, setPriceCurrency] = useState<'chaos' | 'divine'>('chaos');
  const [replicaFilter, setReplicaFilter] = useState<'all' | 'no-replicas' | 'replicas-only'>('all');

  // Sorting state - DEFAULT ASCENDING BY CHAOS PRICE
  const [sortField, setSortField] = useState<SortField>('chaosValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Modal and toast state
  const [isTesterOpen, setIsTesterOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Timer to increment ageSeconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAgeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Initial load of leagues
  useEffect(() => {
    const initLeagues = async () => {
      try {
        const data = await fetchLeagues();
        if (data.leagues && data.leagues.length > 0) {
          setLeagues(data.leagues);
          const defaultL = data.leagues.find((l) => l.isDefault) || data.leagues[0];
          setSelectedLeague(defaultL.id);
        }
      } catch (err: any) {
        console.error('Failed to load leagues:', err);
        setError('Failed to contact leagues endpoint. Using fallback Standard league.');
      }
    };
    initLeagues();
  }, []);

  // 2. Load unique items whenever selectedLeague changes
  const loadUniques = useCallback(
    async (league: string, refresh = false) => {
      if (!league) return;
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchUniques(league, refresh);
        setItems(data.items);
        setLastUpdated(data.fetchedAt);
        setAgeSeconds(data.ageSeconds || 0);

        if (refresh) {
          showToast(`Refreshed prices for ${league}!`);
        }
      } catch (err: any) {
        console.error('Failed to load uniques:', err);
        setError(err.message || 'Failed to fetch unique items from poe.ninja');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (selectedLeague) {
      loadUniques(selectedLeague);
    }
  }, [selectedLeague, loadUniques]);

  const handleRefresh = () => {
    loadUniques(selectedLeague, true);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    const minVal = minPrice !== '' ? parseFloat(minPrice) : null;
    const maxVal = maxPrice !== '' ? parseFloat(maxPrice) : null;

    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Replica filter
      if (replicaFilter === 'no-replicas' && item.isReplica) return false;
      if (replicaFilter === 'replicas-only' && !item.isReplica) return false;

      // Price filter
      const price = priceCurrency === 'chaos' ? item.chaosValue : item.divineValue;
      if (minVal !== null && !isNaN(minVal) && price < minVal) return false;
      if (maxVal !== null && !isNaN(maxVal) && price > maxVal) return false;

      // Search filter
      if (lowerSearch) {
        const matchName = item.name.toLowerCase().includes(lowerSearch);
        const matchBase = item.baseType.toLowerCase().includes(lowerSearch);
        if (!matchName && !matchBase) return false;
      }

      return true;
    });
  }, [items, search, selectedCategory, minPrice, maxPrice, priceCurrency, replicaFilter]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'baseType':
          comparison = a.baseType.localeCompare(b.baseType);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'chaosValue':
          comparison = a.chaosValue - b.chaosValue;
          break;
        case 'divineValue':
          comparison = a.divineValue - b.divineValue;
          break;
        case 'listingCount':
          comparison = a.listingCount - b.listingCount;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredItems, sortField, sortDirection]);

  // Selected items array
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedItemIds.has(item.id));
  }, [items, selectedItemIds]);

  // Generated regex chunks
  const chunks = useMemo(() => {
    return generateRegexChunks(selectedItems, items, {
      matchMode,
      prefixMode,
      compressionMode,
      maxCharsPerChunk: 250,
    });
  }, [selectedItems, items, matchMode, prefixMode, compressionMode]);

  // Selection handlers
  const handleToggleItem = (item: UniqueItem) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedItemIds(new Set());
    showToast('Selection cleared.');
  };

  // Bulk selection of filtered items
  const allFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every((item) => selectedItemIds.has(item.id));
  }, [filteredItems, selectedItemIds]);

  const handleToggleSelectAllFiltered = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        // Deselect filtered
        filteredItems.forEach((item) => next.delete(item.id));
        showToast(`Deselected ${filteredItems.length} filtered items.`);
      } else {
        // Select filtered
        filteredItems.forEach((item) => next.add(item.id));
        showToast(`Selected all ${filteredItems.length} filtered items!`);
      }
      return next;
    });
  };

  const handleApplyPreset = (min: string, max: string, curr: 'chaos' | 'divine') => {
    setMinPrice(min);
    setMaxPrice(max);
    setPriceCurrency(curr);
    setPage(1);
    showToast(`Applied price preset: ${min ? min : '0'} to ${max ? max : '∞'} ${curr}`);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setReplicaFilter('all');
    setPage(1);
    showToast('Filters reset.');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default to asc for prices/names
      setSortDirection('asc');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-arpg-darkest">
      {/* Header */}
      <Header
        leagues={leagues}
        selectedLeague={selectedLeague}
        onSelectLeague={(l) => {
          setSelectedLeague(l);
          setPage(1);
        }}
        lastUpdated={lastUpdated}
        ageSeconds={ageSeconds}
        totalItems={items.length}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onOpenTester={() => setIsTesterOpen(true)}
        generatedChunkCount={chunks.length}
      />

      {/* Sticky Regex Bar */}
      <RegexBar
        chunks={chunks}
        selectedCount={selectedItemIds.size}
        matchMode={matchMode}
        onChangeMatchMode={setMatchMode}
        prefixMode={prefixMode}
        onChangePrefixMode={setPrefixMode}
        compressionMode={compressionMode}
        onChangeCompressionMode={setCompressionMode}
        onClearSelection={handleClearSelection}
        onCopyToast={showToast}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Error banner if any */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 flex items-center gap-3 text-rose-300 text-xs shadow-lg">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <div className="flex-1">{error}</div>
            <button
              onClick={() => loadUniques(selectedLeague, true)}
              className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading overlay if initial load */}
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-10 h-10 text-poe-unique-bright animate-spin" />
            <p className="text-sm text-poe-gold-light font-medium poe-font-cinzel tracking-wider">
              Summoning live PoE 1 economy data from poe.ninja...
            </p>
            <p className="text-xs text-arpg-muted">
              Fetching Weapons, Armour, Accessories, Flasks, Jewels, and Tinctures
            </p>
          </div>
        ) : (
          <>
            {/* Filter and Bulk Controls */}
            <FilterControls
              search={search}
              onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={(val) => {
                setMinPrice(val);
                setPage(1);
              }}
              onMaxPriceChange={(val) => {
                setMaxPrice(val);
                setPage(1);
              }}
              priceCurrency={priceCurrency}
              onCurrencyChange={setPriceCurrency}
              replicaFilter={replicaFilter}
              onReplicaFilterChange={(val) => {
                setReplicaFilter(val);
                setPage(1);
              }}
              categoryCounts={categoryCounts}
              filteredCount={filteredItems.length}
              totalCount={items.length}
              allFilteredSelected={allFilteredSelected}
              onToggleSelectAllFiltered={handleToggleSelectAllFiltered}
              onApplyPreset={handleApplyPreset}
              onResetFilters={handleResetFilters}
            />

            {/* Item Table */}
            <ItemTable
              items={sortedItems}
              selectedItemIds={selectedItemIds}
              onToggleItem={handleToggleItem}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              totalFilteredCount={filteredItems.length}
            />
          </>
        )}
      </main>

      {/* Live Inscribed Ultimatum Tester Modal */}
      <RegexTesterModal
        isOpen={isTesterOpen}
        onClose={() => setIsTesterOpen(false)}
        chunks={chunks}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-arpg-panel border border-poe-unique/80 shadow-glow-orange text-poe-gold-light text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
