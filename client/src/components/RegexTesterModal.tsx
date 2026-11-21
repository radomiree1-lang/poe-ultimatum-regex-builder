import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { RegexChunk } from '../services/types.js';
import { testUltimatumRegex } from '../services/regexEngine.js';

interface RegexTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: RegexChunk[];
}

interface PresetTooltip {
  id: string;
  title: string;
  text: string;
  notes: string;
}

const PRESET_TOOLTIPS: PresetTooltip[] = [
  {
    id: 'kaom-sac',
    title: "Sacrifice: Kaom's Sign",
    text: `Inscribed Ultimatum
Area Level: 83
Item Quantity: +60%
--------
Requires Sacrifice: Kaom's Sign, Coral Ring
Reward: 8x Chaos Orb
--------
Survive 10 Waves
--------
Take this item to the Trialmaster's Altar in the Ultimatum`,
    notes: "Requires Sacrifice has Kaom's Sign. Reward is currency.",
  },
  {
    id: 'tabula-sac',
    title: 'Sacrifice: Tabula Rasa',
    text: `Inscribed Ultimatum
Area Level: 80
--------
Requires Sacrifice: Tabula Rasa, Simple Robe
Reward: 2x Exalted Orb
--------
Protect the Altar for 8 Waves
--------
Take this item to the Trialmaster's Altar in the Ultimatum`,
    notes: 'Requires Sacrifice has Tabula Rasa.',
  },
  {
    id: 'mageblood-rew',
    title: 'Reward: Mageblood',
    text: `Inscribed Ultimatum
Area Level: 84
--------
Requires Sacrifice: 1x Divine Orb
Reward: Mageblood, Heavy Belt
--------
Defeat the Trialmaster
--------
Take this item to the Trialmaster's Altar in the Ultimatum`,
    notes: 'Sacrifice is currency, Reward is Mageblood.',
  },
  {
    id: 'headhunter-rew',
    title: 'Reward: Headhunter',
    text: `Inscribed Ultimatum
Area Level: 83
--------
Requires Sacrifice: 10x Exalted Orb
Reward: Headhunter, Leather Belt
--------
Survive 10 Waves
--------
Take this item to the Trialmaster's Altar in the Ultimatum`,
    notes: 'Reward has Headhunter.',
  },
  {
    id: 'goldrim-sac',
    title: 'Sacrifice: Goldrim',
    text: `Inscribed Ultimatum
Area Level: 75
--------
Requires Sacrifice: Goldrim, Leather Cap
Reward: 5x Chaos Orb
--------
Defeat 5 Waves of Enemies
--------
Take this item to the Trialmaster's Altar in the Ultimatum`,
    notes: 'Requires Sacrifice has Goldrim.',
  },
];

export const RegexTesterModal: React.FC<RegexTesterModalProps> = ({
  isOpen,
  onClose,
  chunks,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('kaom-sac');
  const [customText, setCustomText] = useState<string>(PRESET_TOOLTIPS[0].text);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const preset = PRESET_TOOLTIPS.find((p) => p.id === selectedPresetId);
    if (preset) {
      setCustomText(preset.text);
    }
  }, [selectedPresetId]);

  if (!isOpen) return null;

  const testResult = testUltimatumRegex(customText, chunks);

  const handleCopyRegex = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-arpg-panel border border-poe-unique/60 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-arpg-border flex items-center justify-between bg-arpg-darkest">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-poe-unique/20 border border-poe-unique/40 text-poe-unique-bright">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="poe-font-cinzel text-lg font-bold text-poe-gold-light">
                Inscribed Ultimatum Regex Tester
              </h2>
              <p className="text-xs text-arpg-muted">
                Test your generated regex against realistic PoE 1 Inscribed Ultimatum tooltips
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-arpg-muted hover:text-white hover:bg-arpg-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Active Regex Summary */}
          <div className="bg-arpg-darkest p-3 rounded-lg border border-arpg-border space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-arpg-muted font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-poe-gold" />
                <span>Currently Testing {chunks.length} Generated Regex Chunk(s):</span>
              </span>
              {chunks.length > 0 && (
                <button
                  onClick={() => handleCopyRegex(chunks[0].quotedString)}
                  className="text-poe-gold hover:text-poe-gold-light flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy #1'}</span>
                </button>
              )}
            </div>

            {chunks.length === 0 ? (
              <p className="text-xs text-amber-400/80 italic">
                No items are currently selected. Select one or more items in the main table first!
              </p>
            ) : (
              <div className="space-y-1">
                {chunks.map((chunk) => (
                  <div
                    key={chunk.index}
                    className="flex items-center gap-2 text-xs font-mono bg-arpg-surface/80 p-2 rounded border border-arpg-border/60"
                  >
                    <span className="text-poe-gold font-bold">#{chunk.index}:</span>
                    <span className="text-poe-gold-light truncate flex-1">
                      {chunk.quotedString}
                    </span>
                    <span className="text-[11px] text-arpg-muted whitespace-nowrap">
                      {chunk.charCount} / 250 chars
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Verdict Banner */}
          {chunks.length > 0 && (
            <div>
              {testResult.matched ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-arpg-darkest border border-emerald-500/60 flex items-start gap-3 shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-emerald-300">
                      MATCH CONFIRMED! In-game stash search will highlight this Inscribed Ultimatum.
                    </h3>
                    <p className="text-xs text-emerald-200/80">
                      Matched using <strong>Regex #{testResult.matchingChunkIndex}</strong> on the{' '}
                      <span className="font-semibold underline">
                        {testResult.lineType === 'reward'
                          ? 'Reward'
                          : testResult.lineType === 'sacrifice'
                          ? 'Requires Sacrifice'
                          : 'Tooltip'}
                      </span>{' '}
                      line.
                    </p>
                    {testResult.matchedLineText && (
                      <div className="mt-2 text-xs font-mono bg-emerald-950/80 p-2 rounded border border-emerald-500/30 text-emerald-200">
                        Line: "{testResult.matchedLineText}"
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-arpg-darkest border border-rose-500/50 flex items-start gap-3 shadow-lg">
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-rose-300">
                      NO MATCH — In-game search would NOT highlight this Ultimatum.
                    </h3>
                    <p className="text-xs text-arpg-muted">
                      Check your Match Mode (e.g. if set to "Reward Only", an item in "Requires Sacrifice" won't match) or ensure the item is included in your selection.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preset Buttons */}
          <div>
            <label className="text-xs text-arpg-muted font-medium mb-2 block">
              Select Sample Inscribed Ultimatum Preset:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOOLTIPS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedPresetId === preset.id
                      ? 'bg-poe-unique text-white border border-poe-unique-bright shadow-sm'
                      : 'bg-arpg-darkest text-arpg-muted hover:text-white hover:bg-arpg-surface border border-arpg-border'
                  }`}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tooltip Editor & Visual Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Editor Textarea */}
            <div>
              <label className="text-xs text-arpg-muted font-medium mb-1.5 block">
                Edit Mock Tooltip Text:
              </label>
              <textarea
                value={customText}
                onChange={(e) => {
                  setSelectedPresetId('custom');
                  setCustomText(e.target.value);
                }}
                rows={9}
                className="w-full p-3 rounded-lg arpg-input font-mono text-xs leading-relaxed resize-y"
                placeholder="Paste any Inscribed Ultimatum tooltip text here..."
              />
            </div>

            {/* Visual PoE Tooltip Preview */}
            <div>
              <label className="text-xs text-arpg-muted font-medium mb-1.5 block">
                Visual In-Game Tooltip Preview:
              </label>
              <div className="bg-[#0b0c10] border-2 border-[#544129] rounded p-4 font-mono text-xs shadow-2xl space-y-1 text-center">
                {customText.split(/\r?\n/).map((line, idx) => {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('--------')) {
                    return (
                      <div key={idx} className="text-[#544129] my-1 tracking-widest text-[10px]">
                        ———————
                      </div>
                    );
                  }

                  // Determine line styling
                  const isHeader = idx === 0 || trimmed.includes('Inscribed Ultimatum');
                  const isSacrifice = trimmed.toLowerCase().includes('sacrifice:');
                  const isReward = trimmed.toLowerCase().includes('reward:');
                  const isMatchedLine = testResult.matched && testResult.matchedLineIndex === idx;

                  let colorClass = 'text-[#7e859b]';
                  if (isHeader) colorClass = 'text-poe-unique font-bold text-sm tracking-wide';
                  else if (isReward) colorClass = 'text-amber-200 font-semibold';
                  else if (isSacrifice) colorClass = 'text-red-300 font-semibold';

                  return (
                    <div
                      key={idx}
                      className={`py-0.5 px-2 rounded transition-all ${
                        isMatchedLine
                          ? 'bg-amber-950/80 text-poe-gold-light border border-poe-gold/80 font-bold shadow-glow-gold'
                          : colorClass
                      }`}
                    >
                      {trimmed || '\u00A0'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-arpg-border bg-arpg-darkest flex items-center justify-between text-xs text-arpg-muted">
          <span>In-game search matches case-insensitively and filters entire stash tab.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-arpg-surface hover:bg-arpg-border text-arpg-text font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
