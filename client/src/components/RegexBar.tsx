import React, { useState } from 'react';
import {
  Copy,
  Check,
  Trash2,
  FileCode,
  Target,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  CompressionMode,
  MatchMode,
  PrefixMode,
  RegexChunk,
} from '../services/types.js';

interface RegexBarProps {
  chunks: RegexChunk[];
  selectedCount: number;
  hasSelectedCards?: boolean;
  matchMode: MatchMode;
  onChangeMatchMode: (mode: MatchMode) => void;
  prefixMode: PrefixMode;
  onChangePrefixMode: (mode: PrefixMode) => void;
  compressionMode: CompressionMode;
  onChangeCompressionMode: (mode: CompressionMode) => void;
  onClearSelection: () => void;
  onCopyToast: (message: string) => void;
}

export const RegexBar: React.FC<RegexBarProps> = ({
  chunks,
  selectedCount,
  hasSelectedCards = false,
  matchMode,
  onChangeMatchMode,
  prefixMode,
  onChangePrefixMode,
  compressionMode,
  onChangeCompressionMode,
  onClearSelection,
  onCopyToast,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyChunk = (chunk: RegexChunk) => {
    navigator.clipboard.writeText(chunk.quotedString);
    setCopiedIndex(chunk.index);
    onCopyToast(`Copied Regex #${chunk.index} to clipboard!`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (chunks.length === 0) return;
    const allText = chunks.map((c) => c.quotedString).join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    onCopyToast(`Copied all ${chunks.length} regex chunks to clipboard!`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const getCharColorClass = (count: number) => {
    if (count <= 180) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
    if (count <= 240) return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/30 font-bold';
  };

  const getProgressColor = (count: number) => {
    if (count <= 180) return 'bg-emerald-500';
    if (count <= 240) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="sticky top-[57px] z-30 bg-arpg-panel/95 backdrop-blur-md border-b border-arpg-border shadow-xl">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-3">
        {/* Controls Row: Match Mode, Compact Prefix, Compression, Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Match Mode Toggles */}
          <div className="flex items-center gap-1.5 bg-arpg-darkest p-1 rounded-lg border border-arpg-border">
            <span className="text-arpg-muted px-2 font-medium flex items-center gap-1">
              <Target className="w-3 h-3 text-poe-unique-bright" />
              <span>Target:</span>
            </span>

            <button
              onClick={() => onChangeMatchMode('reward')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                matchMode === 'reward'
                  ? 'bg-poe-unique text-white shadow-sm'
                  : 'text-arpg-muted hover:text-white'
              }`}
            >
              Reward Only
            </button>

            <button
              onClick={() => onChangeMatchMode('sacrifice')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                matchMode === 'sacrifice'
                  ? 'bg-poe-unique text-white shadow-sm'
                  : 'text-arpg-muted hover:text-white'
              }`}
            >
              Sacrifice Only
            </button>

            <button
              onClick={() => onChangeMatchMode('either')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                matchMode === 'either'
                  ? 'bg-poe-unique text-white shadow-sm'
                  : 'text-arpg-muted hover:text-white'
              }`}
            >
              Any (Either)
            </button>
          </div>

          {/* Syntax and Compression options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Compact Syntax Toggle (only relevant if not 'either') */}
            {matchMode !== 'either' && (
              <div className="flex items-center gap-1 bg-arpg-darkest p-1 rounded-lg border border-arpg-border">
                <span className="text-arpg-muted px-1.5 text-[11px]">Syntax:</span>
                <button
                  onClick={() => onChangePrefixMode('standard')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    prefixMode === 'standard'
                      ? 'bg-arpg-surface text-poe-gold-light border border-poe-gold/40'
                      : 'text-arpg-muted hover:text-white'
                  }`}
                  title="Standard PoE prefix (e.g. reward: .*(...) or sacrifice: .*(...))"
                >
                  Standard
                </button>
                <button
                  onClick={() => onChangePrefixMode('compact')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    prefixMode === 'compact'
                      ? 'bg-arpg-surface text-poe-gold-light border border-poe-gold/40'
                      : 'text-arpg-muted hover:text-white'
                  }`}
                  title="Compact prefix: 'd: .*(' for reward or 'ce: .*(' for sacrifice to save 5+ chars!"
                >
                  Compact (d: / ce:)
                </button>
              </div>
            )}

            {/* Smart Shorten / Compression Toggle */}
            <div className="flex items-center gap-1 bg-arpg-darkest p-1 rounded-lg border border-arpg-border">
              <span className="text-arpg-muted px-1.5 text-[11px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-poe-gold" />
                <span>Names:</span>
              </span>
              <button
                onClick={() => onChangeCompressionMode('full')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  compressionMode === 'full'
                    ? 'bg-arpg-surface text-poe-gold-light border border-poe-gold/40'
                    : 'text-arpg-muted hover:text-white'
                }`}
              >
                Full Names
              </button>
              <button
                onClick={() => onChangeCompressionMode('short')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  compressionMode === 'short'
                    ? 'bg-gradient-to-r from-amber-900/60 to-poe-unique text-white border border-poe-unique-bright/60 shadow-sm'
                    : 'text-arpg-muted hover:text-white'
                }`}
                title="Computes the shortest unique collision-free substring (>=3 chars) for each item"
              >
                Smart Shorten ⚡
              </button>
            </div>

            {/* Selection Status & Clear Button */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-2 pl-2">
                <span className="px-2 py-0.5 rounded bg-poe-unique/20 text-poe-unique-bright text-xs font-semibold border border-poe-unique/40">
                  {selectedCount} item{selectedCount === 1 ? '' : 's'}
                </span>
                <button
                  onClick={onClearSelection}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-arpg-darkest hover:bg-rose-950/40 text-arpg-muted hover:text-rose-300 border border-arpg-border hover:border-rose-500/40 text-[11px] font-medium transition-all cursor-pointer"
                  title="Clear all selected items"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divination Card Information Alert if cards are selected */}
        {hasSelectedCards && (
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-700/60 text-xs text-cyan-200">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-cyan-300">
                PoE 1 Inscribed Ultimatum Card Rule:
              </span>{' '}
              <span>
                Card Ultimatums always duplicate cards, so in-game the card name is listed under{' '}
                <code className="bg-cyan-950 px-1 py-0.2 rounded text-cyan-300 font-mono text-[11px]">
                  Requires Sacrifice: &lt;Card&gt; x&lt;N&gt;
                </code>{' '}
                and the reward line is literally{' '}
                <code className="bg-cyan-950 px-1 py-0.2 rounded text-cyan-300 font-mono text-[11px]">
                  Reward: Doubles sacrificed Divination Cards
                </code>
                . The regex automatically matches the <strong>Sacrifice</strong> line so your cards are highlighted in your stash!
              </span>
            </div>
          </div>
        )}

        {/* Output Regex Display */}
        {selectedCount === 0 ? (
          <div className="bg-arpg-darkest/70 border border-dashed border-arpg-border rounded-lg p-4 text-center">
            <p className="text-arpg-muted text-sm flex items-center justify-center gap-2">
              <FileCode className="w-4 h-4 text-arpg-muted" />
              <span>Select unique items or divination cards below to generate your Inscribed Ultimatum stash search regex.</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Chunks overview header if > 1 chunk */}
            {chunks.length > 1 && (
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1.5 text-poe-gold">
                  <Info className="w-3.5 h-3.5" />
                  <span>
                    Selection exceeds 250 characters. Split into{' '}
                    <strong>{chunks.length} PoE 1 regex chunks</strong> (each &le; 250 chars).
                  </span>
                </div>
                <button
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-arpg-surface hover:bg-arpg-border text-poe-gold-light hover:text-white border border-poe-gold/40 text-xs font-medium cursor-pointer transition-all"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'All Copied!' : 'Copy All Chunks'}</span>
                </button>
              </div>
            )}

            {/* List of Chunks */}
            <div className="space-y-2">
              {chunks.map((chunk) => {
                const percent = Math.min(100, Math.round((chunk.charCount / 250) * 100));
                const isCopied = copiedIndex === chunk.index;

                return (
                  <div
                    key={chunk.index}
                    className="arpg-card rounded-lg p-2.5 sm:p-3 border border-arpg-border hover:border-poe-unique/50 transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
                  >
                    {/* Chunk label + Progress */}
                    <div className="flex md:flex-col items-center md:items-start justify-between md:justify-center gap-1 min-w-[130px] border-b md:border-b-0 md:border-r border-arpg-border pb-2 md:pb-0 md:pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-poe-gold">
                          Regex #{chunk.index}
                        </span>
                        <span className="text-[10px] text-arpg-muted">
                          ({chunk.itemCount} item{chunk.itemCount === 1 ? '' : 's'})
                        </span>
                      </div>

                      {/* Character Counter & Mini Progress Bar */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border font-mono ${getCharColorClass(
                            chunk.charCount
                          )}`}
                        >
                          {chunk.charCount} / 250
                        </span>
                      </div>
                      <div className="w-full bg-arpg-darkest h-1.5 rounded-full overflow-hidden mt-1 hidden md:block">
                        <div
                          className={`h-full transition-all duration-300 ${getProgressColor(
                            chunk.charCount
                          )}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Regex Code Box */}
                    <div className="flex-1 overflow-x-auto bg-arpg-darkest/90 rounded border border-arpg-border/70 p-2 sm:px-3 sm:py-2">
                      <code className="poe-font-mono text-xs sm:text-sm text-poe-gold-light select-all whitespace-nowrap block">
                        {chunk.quotedString}
                      </code>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyChunk(chunk)}
                      className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-amber-700 via-poe-unique to-poe-unique-bright hover:from-amber-600 hover:to-amber-500 text-white shadow-glow-orange'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-amber-100" />
                          <span>Copy Regex #{chunk.index}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
