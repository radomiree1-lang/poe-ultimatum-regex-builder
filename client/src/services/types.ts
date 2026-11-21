export type UniqueCategory =
  | 'Weapon'
  | 'Armour'
  | 'Accessory'
  | 'Flask'
  | 'Jewel'
  | 'Tincture'
  | 'Divination Card';

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

export interface LeagueInfo {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface UniquesApiResponse {
  league: string;
  cached: boolean;
  fetchedAt: string;
  ageSeconds: number;
  totalCount: number;
  items: UniqueItem[];
}

export type MatchMode = 'reward' | 'sacrifice' | 'either';
export type PrefixMode = 'standard' | 'compact';
export type CompressionMode = 'full' | 'short';

export interface RegexOptions {
  matchMode: MatchMode;
  prefixMode: PrefixMode;
  compressionMode: CompressionMode;
  maxCharsPerChunk?: number;
}

export interface RegexChunk {
  index: number;
  quotedString: string;
  rawPattern: string;
  charCount: number;
  itemCount: number;
  itemNames: string[];
}

export interface TestMatchResult {
  matched: boolean;
  matchingChunkIndex?: number;
  matchingChunkRegex?: string;
  matchedText?: string;
  matchedLineIndex?: number;
  matchedLineText?: string;
  lineType?: 'reward' | 'sacrifice' | 'other';
}
