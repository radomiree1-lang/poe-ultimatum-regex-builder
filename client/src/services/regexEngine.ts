import {
  MatchMode,
  PrefixMode,
  RegexChunk,
  RegexOptions,
  TestMatchResult,
  UniqueItem,
} from './types.js';

export const ULTIMATUM_KEYWORDS = [
  'inscribed',
  'ultimatum',
  'challenge',
  'survive',
  'protect',
  'altar',
  'defeat',
  'waves',
  'area',
  'level',
  'requires',
  'sacrifice',
  'reward',
  'trialmaster',
  'quantity',
  'take',
];

/**
 * Escapes regex special characters for PoE 1 search.
 * Characters escaped: \ . ( ) + ? [ ] ^ $ * { } |
 * Safe characters left intact: ' - , spaces and alphanumeric.
 */
export function escapePoERegex(text: string): string {
  return text.toLowerCase().replace(/[\\.^$*+?()[\]{}|]/g, '\\$&');
}

/**
 * Checks if a substring collides with standard Ultimatum static keywords.
 */
export function collidesWithKeywords(sub: string): boolean {
  const lowerSub = sub.toLowerCase();
  for (const kw of ULTIMATUM_KEYWORDS) {
    if (kw.includes(lowerSub) || lowerSub.includes(kw)) {
      return true;
    }
  }
  return false;
}

/**
 * Finds the shortest contiguous substring (min length 3) of an item name
 * that uniquely identifies it without matching any unselected items
 * and without colliding with Inscribed Ultimatum tooltip keywords.
 */
export function findShortestUniqueSubstring(
  itemName: string,
  unselectedNames: Set<string>
): string {
  const lower = itemName.toLowerCase();
  const fullEscaped = escapePoERegex(lower);

  // If item name is already short (<= 3 chars), use full escaped
  if (lower.length <= 3) {
    return fullEscaped;
  }

  // Pre-filter unselected names: keep only lowercased names
  const unselectedArray = Array.from(unselectedNames).map((n) => n.toLowerCase());

  // Search by substring length from 3 up to lower.length - 1
  for (let len = 3; len < lower.length; len++) {
    const candidates: Array<{ sub: string; escaped: string; escapes: number }> = [];

    for (let i = 0; i <= lower.length - len; i++) {
      const sub = lower.substring(i, i + len);

      // Check collision with Ultimatum keywords
      if (collidesWithKeywords(sub)) {
        continue;
      }

      // Check collision with unselected items
      let collidesWithUnselected = false;
      for (const unselected of unselectedArray) {
        if (unselected.includes(sub)) {
          collidesWithUnselected = true;
          break;
        }
      }

      if (!collidesWithUnselected) {
        const escaped = escapePoERegex(sub);
        // Count number of escape slashes added
        const escapes = escaped.length - sub.length;
        candidates.push({ sub, escaped, escapes });
      }
    }

    if (candidates.length > 0) {
      // Sort candidates: prefer fewer escape slashes, then alphabetical
      candidates.sort((a, b) => {
        if (a.escapes !== b.escapes) return a.escapes - b.escapes;
        return a.escaped.localeCompare(b.escaped);
      });

      // If the candidate's escaped length is strictly shorter than fullEscaped, return it
      if (candidates[0].escaped.length < fullEscaped.length) {
        return candidates[0].escaped;
      }
    }
  }

  // Fallback to full escaped name
  return fullEscaped;
}

export function getPrefixAndSuffix(
  matchMode: MatchMode,
  prefixMode: PrefixMode
): { prefix: string; suffix: string } {
  switch (matchMode) {
    case 'reward':
      return {
        prefix: prefixMode === 'compact' ? 'd: .*(' : 'reward: .*(',
        suffix: ')',
      };
    case 'sacrifice':
      return {
        prefix: prefixMode === 'compact' ? 'ce: .*(' : 'sacrifice: .*(',
        suffix: ')',
      };
    case 'either':
    default:
      return {
        prefix: '(',
        suffix: ')',
      };
  }
}

/**
 * Generates regex chunks <= 250 characters for selected items.
 */
export function generateRegexChunks(
  selectedItems: UniqueItem[],
  allLoadedItems: UniqueItem[],
  options: RegexOptions
): RegexChunk[] {
  if (selectedItems.length === 0) {
    return [];
  }

  const { matchMode, prefixMode, compressionMode, maxCharsPerChunk = 250 } = options;
  const { prefix, suffix } = getPrefixAndSuffix(matchMode, prefixMode);

  // Set of unselected item names
  const selectedNameSet = new Set(selectedItems.map((i) => i.name));
  const unselectedNames = new Set<string>();
  for (const item of allLoadedItems) {
    if (!selectedNameSet.has(item.name)) {
      unselectedNames.add(item.name);
    }
  }

  // Compute tokens for each selected item
  const itemTokens: Array<{ name: string; token: string }> = selectedItems.map(
    (item) => {
      let token: string;
      if (compressionMode === 'short') {
        token = findShortestUniqueSubstring(item.name, unselectedNames);
      } else {
        token = escapePoERegex(item.name);
      }
      return { name: item.name, token };
    }
  );

  // Deduplicate tokens (in case two selected items yielded identical substrings or names)
  const uniqueTokens: Array<{ name: string; token: string }> = [];
  const seenTokens = new Set<string>();
  for (const it of itemTokens) {
    if (!seenTokens.has(it.token)) {
      seenTokens.add(it.token);
      uniqueTokens.push(it);
    }
  }

  // Fixed overhead: 2 double quotes + prefix + suffix
  const fixedOverhead = 2 + prefix.length + suffix.length;
  const maxPayload = maxCharsPerChunk - fixedOverhead;

  const chunks: RegexChunk[] = [];
  let currentTokens: string[] = [];
  let currentItems: string[] = [];
  let currentPayloadLen = 0;

  for (const { name, token } of uniqueTokens) {
    // If adding this token would fit in current chunk
    const additionLen = currentTokens.length === 0 ? token.length : 1 + token.length; // +1 for '|'

    if (currentTokens.length > 0 && currentPayloadLen + additionLen > maxPayload) {
      // Seal current chunk
      const innerPattern = currentTokens.join('|');
      const rawPattern = `${prefix}${innerPattern}${suffix}`;
      const quotedString = `"${rawPattern}"`;

      chunks.push({
        index: chunks.length + 1,
        quotedString,
        rawPattern,
        charCount: quotedString.length,
        itemCount: currentItems.length,
        itemNames: [...currentItems],
      });

      // Reset for next chunk
      currentTokens = [token];
      currentItems = [name];
      currentPayloadLen = token.length;
    } else {
      currentTokens.push(token);
      currentItems.push(name);
      currentPayloadLen += additionLen;
    }
  }

  // Push final chunk
  if (currentTokens.length > 0) {
    const innerPattern = currentTokens.join('|');
    const rawPattern = `${prefix}${innerPattern}${suffix}`;
    const quotedString = `"${rawPattern}"`;

    chunks.push({
      index: chunks.length + 1,
      quotedString,
      rawPattern,
      charCount: quotedString.length,
      itemCount: currentItems.length,
      itemNames: [...currentItems],
    });
  }

  return chunks;
}

/**
 * Tests an Inscribed Ultimatum tooltip text against regex chunks.
 */
export function testUltimatumRegex(
  tooltipText: string,
  chunks: RegexChunk[]
): TestMatchResult {
  if (!tooltipText || chunks.length === 0) {
    return { matched: false };
  }

  const lines = tooltipText.split(/\r?\n/);

  for (const chunk of chunks) {
    let regex: RegExp;
    try {
      regex = new RegExp(chunk.rawPattern, 'i');
    } catch {
      continue;
    }

    // First check line by line
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex].trim();
      if (!line) continue;

      const match = line.match(regex);
      if (match) {
        const lowerLine = line.toLowerCase();
        let lineType: 'reward' | 'sacrifice' | 'other' = 'other';
        if (lowerLine.includes('reward:')) {
          lineType = 'reward';
        } else if (lowerLine.includes('sacrifice:')) {
          lineType = 'sacrifice';
        }

        return {
          matched: true,
          matchingChunkIndex: chunk.index,
          matchingChunkRegex: chunk.quotedString,
          matchedText: match[0],
          matchedLineIndex: lineIndex,
          matchedLineText: line,
          lineType,
        };
      }
    }

    // Also check the entire text in case of multiline match
    const fullMatch = tooltipText.match(regex);
    if (fullMatch) {
      return {
        matched: true,
        matchingChunkIndex: chunk.index,
        matchingChunkRegex: chunk.quotedString,
        matchedText: fullMatch[0],
        lineType: 'other',
      };
    }
  }

  return { matched: false };
}
