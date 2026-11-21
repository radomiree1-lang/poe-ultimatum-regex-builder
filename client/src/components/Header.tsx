import React from 'react';
import {
  RotateCw,
  FlaskConical,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';
import { LeagueInfo } from '../services/types.js';

interface HeaderProps {
  leagues: LeagueInfo[];
  selectedLeague: string;
  onSelectLeague: (league: string) => void;
  lastUpdated: string | null;
  ageSeconds: number;
  totalItems: number;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenTester: () => void;
  generatedChunkCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  leagues,
  selectedLeague,
  onSelectLeague,
  lastUpdated,
  ageSeconds,
  totalItems,
  isLoading,
  onRefresh,
  onOpenTester,
  generatedChunkCount,
}) => {
  const formatAge = (seconds: number) => {
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  return (
    <header className="border-b border-arpg-border bg-arpg-darkest/95 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-amber-900/60 via-red-950 to-arpg-darkest border border-poe-unique/60 flex items-center justify-center shadow-glow-orange">
            <Flame className="w-6 h-6 text-poe-unique-bright animate-pulse-subtle" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-poe-gold/20 border border-poe-gold/50 flex items-center justify-center text-[10px] font-bold text-poe-gold">
              1
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="poe-font-cinzel text-lg sm:text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-poe-gold via-poe-unique-bright to-amber-200">
                PoE 1 Inscribed Ultimatum
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-poe-unique/20 text-poe-unique-bright border border-poe-unique/40 font-mono font-medium">
                Regex Builder
              </span>
            </div>
            <p className="text-xs text-arpg-muted flex items-center gap-1.5 mt-0.5">
              <span>Stash search regex generator for Uniques & Divination Cards powered by</span>
              <span className="text-poe-gold font-medium">poe.ninja</span>
            </p>
          </div>
        </div>

        {/* Right Controls: League Switcher, Live Refresh, Tester Button */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-end">
          {/* League Dropdown */}
          <div className="flex items-center bg-arpg-panel border border-arpg-border rounded-lg p-1 text-xs">
            <span className="text-arpg-muted px-2 font-medium">League:</span>
            <select
              value={selectedLeague}
              onChange={(e) => onSelectLeague(e.target.value)}
              disabled={isLoading}
              className="bg-arpg-dark text-arpg-text text-xs rounded px-2.5 py-1 font-medium border border-arpg-border hover:border-poe-unique/50 focus:border-poe-unique outline-none cursor-pointer disabled:opacity-50"
            >
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name} {league.isDefault ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Last updated & refresh button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title={lastUpdated ? `Fetched at ${new Date(lastUpdated).toLocaleTimeString()}` : 'Refresh prices'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-arpg-panel border border-arpg-border hover:border-poe-unique/60 hover:text-poe-unique-bright text-xs text-arpg-muted font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-poe-unique-bright' : ''}`} />
            <Clock className="w-3.5 h-3.5 ml-1 hidden sm:inline" />
            <span className="text-[11px]">{formatAge(ageSeconds)}</span>
          </button>

          {/* Items loaded indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-arpg-panel/80 border border-arpg-border text-[11px] text-arpg-muted">
            <Layers className="w-3.5 h-3.5 text-poe-gem" />
            <span>{totalItems.toLocaleString()} items</span>
          </div>

          {/* Live Regex Tester Modal Trigger */}
          <button
            onClick={onOpenTester}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-900/40 to-poe-unique/30 hover:from-amber-900/60 hover:to-poe-unique/50 border border-poe-unique/60 text-poe-gold-light hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <FlaskConical className="w-4 h-4 text-poe-unique-bright" />
            <span>Test In Tooltip</span>
            {generatedChunkCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-poe-gem animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
