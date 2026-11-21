import { CORE_ULTIMATUM_UNIQUES } from './data/coreUniques.js';
import {
  LeagueInfo,
  PoeNinjaLine,
  PoeNinjaResponse,
  UniqueCategory,
  UniqueItem,
} from './types.js';

const ULTIMATUM_CORE_SET = new Set(
  CORE_ULTIMATUM_UNIQUES.map((n) => n.toLowerCase())
);

export function isItemInUltimatumPool(
  name: string,
  category: UniqueCategory,
  isReplica: boolean
): boolean {
  if (isReplica) return false;
  if (category === 'Tincture') return false;
  return ULTIMATUM_CORE_SET.has(name.toLowerCase());
}

const CATEGORY_MAP: Record<string, UniqueCategory> = {
  UniqueWeapon: 'Weapon',
  UniqueArmour: 'Armour',
  UniqueAccessory: 'Accessory',
  UniqueFlask: 'Flask',
  UniqueJewel: 'Jewel',
  UniqueTincture: 'Tincture',
};

const CATEGORIES = Object.keys(CATEGORY_MAP);

export async function fetchLeagues(): Promise<LeagueInfo[]> {
  try {
    const res = await fetch('https://poe.ninja/poe1/api/economy/leagues', {
      headers: { 'User-Agent': 'PoE1-Ultimatum-Regex-Builder/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = (await res.json()) as Array<{ id: string; name: string }>;
      if (Array.isArray(data) && data.length > 0) {
        // Mark default active softcore league (the first non-standard, non-hardcore league)
        const defaultLeague =
          data.find(
            (l) =>
              !l.name.toLowerCase().includes('hardcore') &&
              !l.name.toLowerCase().includes('standard')
          ) || data[0];

        return data.map((l) => ({
          id: l.id,
          name: l.name,
          isDefault: l.id === defaultLeague.id,
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to fetch from /poe1/api/economy/leagues, trying fallback...', err);
  }

  // Fallback endpoint
  try {
    const res = await fetch('https://poe.ninja/api/data/getleaguedata', {
      headers: { 'User-Agent': 'PoE1-Ultimatum-Regex-Builder/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        leagues?: Array<{ id: string; name: string }>;
      };
      if (data.leagues && data.leagues.length > 0) {
        const defaultLeague =
          data.leagues.find(
            (l) =>
              !l.name.toLowerCase().includes('hardcore') &&
              !l.name.toLowerCase().includes('standard')
          ) || data.leagues[0];

        return data.leagues.map((l) => ({
          id: l.id,
          name: l.name,
          isDefault: l.id === defaultLeague.id,
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to fetch from fallback league endpoint, using static fallback:', err);
  }

  // Hardcoded fallback
  return [
    { id: 'Standard', name: 'Standard', isDefault: false },
    { id: 'Hardcore', name: 'Hardcore', isDefault: false },
  ];
}

async function fetchCategoryItems(
  league: string,
  catType: string
): Promise<PoeNinjaLine[]> {
  const primaryUrl = `https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=${encodeURIComponent(
    league
  )}&type=${catType}`;
  const fallbackUrl = `https://poe.ninja/api/data/itemoverview?league=${encodeURIComponent(
    league
  )}&type=${catType}`;

  try {
    const res = await fetch(primaryUrl, {
      headers: { 'User-Agent': 'PoE1-Ultimatum-Regex-Builder/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = (await res.json()) as PoeNinjaResponse;
      if (data && Array.isArray(data.lines)) {
        return data.lines;
      }
    }
  } catch (err) {
    console.warn(`Primary endpoint failed for ${catType}, trying fallback:`, err);
  }

  try {
    const res = await fetch(fallbackUrl, {
      headers: { 'User-Agent': 'PoE1-Ultimatum-Regex-Builder/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = (await res.json()) as PoeNinjaResponse;
      if (data && Array.isArray(data.lines)) {
        return data.lines;
      }
    }
  } catch (err) {
    console.error(`Fallback failed for ${catType}:`, err);
  }

  return [];
}

export function deduplicateAndNormalize(
  rawItems: Array<{ line: PoeNinjaLine; category: UniqueCategory }>
): UniqueItem[] {
  // 1. Exclude foils and linked items (links >= 5)
  const filtered = rawItems.filter(({ line }) => {
    if (!line || !line.name || typeof line.chaosValue !== 'number') return false;
    if (line.chaosValue <= 0) return false;
    // Exclude Foil items (itemClass === 9)
    if (line.itemClass === 9) return false;
    // Exclude 5L / 6L variants (links >= 5)
    if (typeof line.links === 'number' && line.links >= 5) return false;
    return true;
  });

  // 2. Group by exact item name
  const grouped = new Map<
    string,
    Array<{ line: PoeNinjaLine; category: UniqueCategory }>
  >();

  for (const item of filtered) {
    const existing = grouped.get(item.line.name);
    if (existing) {
      existing.push(item);
    } else {
      grouped.set(item.line.name, [item]);
    }
  }

  // 3. For each group, pick lowest non-zero chaosValue and compute variantCount
  const result: UniqueItem[] = [];

  for (const [name, variants] of grouped.entries()) {
    // Sort variants by chaosValue ascending
    variants.sort((a, b) => a.line.chaosValue - b.line.chaosValue);
    const lowest = variants[0];
    const line = lowest.line;
    const category = lowest.category;

    const isReplica = name.startsWith('Replica ');
    const isUltimatumPool = isItemInUltimatumPool(name, category, isReplica);

    // Normalize chaosValue and divineValue
    const chaosValue = Math.round(line.chaosValue * 10) / 10;
    const divineValue =
      typeof line.divineValue === 'number'
        ? Math.round(line.divineValue * 100) / 100
        : 0;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    result.push({
      id: `${slug}-${category.toLowerCase()}`,
      name,
      baseType: line.baseType || '',
      category,
      chaosValue,
      divineValue,
      icon: line.icon || '',
      listingCount: line.listingCount ?? line.count ?? 0,
      variantCount: variants.length,
      isReplica,
      isUltimatumPool,
    });
  }

  // 4. Default sort ascending by chaosValue, then name
  result.sort((a, b) => {
    if (a.chaosValue !== b.chaosValue) {
      return a.chaosValue - b.chaosValue;
    }
    return a.name.localeCompare(b.name);
  });

  return result;
}

export async function fetchAllUniques(league: string): Promise<UniqueItem[]> {
  const fetchPromises = CATEGORIES.map(async (catType) => {
    const lines = await fetchCategoryItems(league, catType);
    const category = CATEGORY_MAP[catType];
    return lines.map((line) => ({ line, category }));
  });

  const categoryResults = await Promise.all(fetchPromises);
  const allLines = categoryResults.flat();

  return deduplicateAndNormalize(allLines);
}
