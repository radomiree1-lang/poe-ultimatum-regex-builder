export type UniqueCategory =
  | 'Weapon'
  | 'Armour'
  | 'Accessory'
  | 'Flask'
  | 'Jewel'
  | 'Tincture'
  | 'Divination Card';

export interface PoeNinjaLine {
  id: number;
  name: string;
  icon: string;
  levelRequired?: number;
  baseType: string;
  itemClass?: number;
  links?: number;
  chaosValue: number;
  divineValue?: number;
  count?: number;
  listingCount?: number;
  detailsId?: string;
  variant?: string | null;
}

export interface PoeNinjaResponse {
  lines?: PoeNinjaLine[];
}

export interface UniqueItem {
  id: string;
  name: string;
  baseType: string;
  category: UniqueCategory;
  chaosValue: number;
  divineValue: number;
  icon: string;
  listingCount: number;
  variantCount: number;
  isReplica: boolean;
  isUltimatumPool: boolean;
}

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

export interface LeagueInfo {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface UniquesResponse {
  league: string;
  cached: boolean;
  fetchedAt: string;
  ageSeconds: number;
  totalCount: number;
  items: UniqueItem[];
}
