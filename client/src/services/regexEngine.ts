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
 * Intelligently handles Divination Cards:
 * In PoE 1 Inscribed Ultimatums, card rewards are always "Doubles sacrificed Divination Cards",
 * so the specific card name is ALWAYS listed on the "Requires Sacrifice: <Card Name> x<Count>" line.
 * When Divination Cards are selected in "Reward" mode, they automatically target the sacrifice line
 * so they properly highlight the card duplication Inscribed Ultimatum in stash!
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

  // Set of unselected item names
  const selectedNameSet = new Set(selectedItems.map((i) => i.name));
  const unselectedNames = new Set<string>();
  for (const item of allLoadedItems) {
    if (!selectedNameSet.has(item.name)) {
      unselectedNames.add(item.name);
    }
  }

  const getToken = (item: UniqueItem) => {
    if (compressionMode === 'short') {
      return findShortestUniqueSubstring(item.name, unselectedNames);
    }
    return escapePoERegex(item.name);
  };

  const uniqueItems = selectedItems.filter((i) => i.category !== 'Divination Card');
  const cardItems = selectedItems.filter((i) => i.category === 'Divination Card');

  interface ItemGroup {
    mode: MatchMode;
    items: UniqueItem[];
  }

  const groups: ItemGroup[] = [];

  if (matchMode === 'either') {
    groups.push({
      mode: 'either',
      items: selectedItems,
    });
  } else if (matchMode === 'sacrifice') {
    groups.push({
      mode: 'sacrifice',
      items: selectedItems,
    });
  } else {
    // matchMode === 'reward'
    // In PoE 1, unique item rewards appear on "Reward: <Item>", so they use 'reward'
    if (uniqueItems.length > 0) {
      groups.push({
        mode: 'reward',
        items: uniqueItems,
      });
    }
    // In PoE 1, Divination Card duplications ALWAYS list the card on "Requires Sacrifice: <Card> x<N>"
    // while the Reward line says "Doubles sacrificed Divination Cards".
    // Therefore, card regexes MUST target 'sacrifice' to highlight in stash!
    if (cardItems.length > 0) {
      groups.push({
        mode: 'sacrifice',
        items: cardItems,
      });
    }
  }

  const chunks: RegexChunk[] = [];

  for (const group of groups) {
    const { prefix, suffix } = getPrefixAndSuffix(group.mode, prefixMode);
    const fixedOverhead = 2 + prefix.length + suffix.length;
    const maxPayload = maxCharsPerChunk - fixedOverhead;

    // Deduplicate tokens
    const uniqueTokens: Array<{ name: string; token: string }> = [];
    const seenTokens = new Set<string>();

    for (const item of group.items) {
      const token = getToken(item);
      if (!seenTokens.has(token)) {
        seenTokens.add(token);
        uniqueTokens.push({ name: item.name, token });
      }
    }

    let currentTokens: string[] = [];
    let currentItems: string[] = [];
    let currentPayloadLen = 0;

    for (const { name, token } of uniqueTokens) {
      const additionLen = currentTokens.length === 0 ? token.length : 1 + token.length;

      if (currentTokens.length > 0 && currentPayloadLen + additionLen > maxPayload) {
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

        currentTokens = [token];
        currentItems = [name];
        currentPayloadLen = token.length;
      } else {
        currentTokens.push(token);
        currentItems.push(name);
        currentPayloadLen += additionLen;
      }
    }

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
