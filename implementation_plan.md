# Implementation Plan: PoE 1 Inscribed Ultimatum Regex Builder

## 1. Project Overview & Architecture
**PoE 1 Inscribed Ultimatum Regex Builder** is a specialized full-stack application designed for Path of Exile 1 players to quickly generate in-game stash search regex strings for Unique items, driven by real-time market prices from `poe.ninja`. Inscribed Ultimatums require sacrificing a specific item for a specified reward (e.g., "Requires Sacrifice: Goldrim, Leather Cap" to receive "Reward: 8x Chaos Orb" or "Reward: Mageblood, Heavy Belt"). Searching stash tabs for profitable or sacrifice-ready Ultimatums requires precise, character-constrained regex strings.

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React (icons), Vitest (testing).
- **Backend / API Proxy**: Node.js, Express, TypeScript, `node-fetch`/native fetch, CORS, in-memory TTL caching.
- **Tooling & Orchestration**: Single root `package.json` with `concurrently` enabling `npm run dev` to start both Vite and Express in one command.

```
+-------------------------------------------------------------+
|                      Browser / Client                       |
|  - React + Tailwind ARPG Dark Obsidian Theme                |
|  - Sticky Regex Bar (Live 250-char counter & chunk buttons)  |
|  - Filters: League, Category, Price Range, Bulk Presets     |
|  - Item Table: Sorted by Chaos price Ascending, selection    |
|  - Live Ultimatum Regex Tester Modal with Mock Tooltips     |
+------------------------------+------------------------------+
                               | /api/*
                               v
+-------------------------------------------------------------+
|                   Backend API Proxy (Node)                  |
|  - Express + TypeScript on port 3001                        |
|  - In-Memory Cache (20-min TTL with timestamp)              |
|  - Parallel fetcher for 6 PoE 1 Unique categories           |
|  - Deduplication: exclude foils, 5L/6L, group variants      |
|  - Fallback mechanisms for poe.ninja endpoints              |
+------------------------------+------------------------------+
                               | External HTTPS
                               v
+-------------------------------------------------------------+
|                          poe.ninja                          |
|  - /poe1/api/economy/leagues                                |
|  - /poe1/api/economy/stash/current/item/overview            |
+-------------------------------------------------------------+
```

---

## 2. API Caching Strategy & Backend Design

### Caching Requirements
- In-memory cache stored per league with a **20-minute Time-To-Live (TTL)**.
- Each cache entry stores:
  - `data`: Normalized unique items list.
  - `fetchedAt`: ISO timestamp of when the fetch occurred.
  - `league`: Target league.
- Cache bypass: If a request includes `?refresh=true`, the cache is invalidated and fresh data is pulled from `poe.ninja`.
- Response metadata returned to frontend:
  ```json
  {
    "league": "Covens",
    "cached": true,
    "fetchedAt": "2026-11-21T17:08:00.000Z",
    "ageMs": 120000,
    "itemCount": 1850,
    "items": [...]
  }
  ```

### Endpoints
1. `GET /api/leagues`:
   - Fetches active leagues from `https://poe.ninja/poe1/api/economy/leagues`.
   - Fallback to `https://poe.ninja/api/data/getleaguedata` if the poe1 endpoint is unreachable, and further fallback to hardcoded defaults (`["Standard", "Hardcore"]` + discovered challenge leagues).
   - Marks default active softcore league (the first non-hardcore, non-standard league).
2. `GET /api/uniques?league={league}&refresh={boolean}`:
   - Fetches in parallel the 6 unique categories:
     - `UniqueWeapon`
     - `UniqueArmour`
     - `UniqueAccessory`
     - `UniqueFlask`
     - `UniqueJewel`
     - `UniqueTincture`
   - Primary URL: `https://poe.ninja/poe1/api/economy/stash/current/item/overview?league={league}&type={TYPE}`
   - Fallback URL: `https://poe.ninja/api/data/itemoverview?league={league}&type={TYPE}`

---

## 3. Deduplication & Data Normalization Logic

Raw `poe.ninja` dumps contain multiple duplicate rows for the same unique item due to different link counts (5L, 6L), foils, relic versions, and varying roll variants (e.g., 1-passive vs 3-passive Voices, roll brackets).

### Filtering Rules
1. **Exclude Foils**: Drop items where `itemClass === 9` or flavor indicates foil/relic skin.
2. **Exclude Linked Variants**: Drop items where `links >= 5` (e.g. 5-link and 6-link body armours/weapons, which inflate the base price).
3. **Replicas**: Items with `name` starting with `"Replica "` are kept as distinct unique items and flagged with `isReplica: true`.
4. **Group by Exact Item Name**:
   - For all entries sharing the exact same `name`:
     - Discard entries with `chaosValue <= 0`.
     - Select the entry with the **lowest non-zero `chaosValue`** (representing the entry-level baseline market price for the item, perfect for Inscribed Ultimatum sacrifices/rewards).
     - Compute `variantCount` (total number of variants in market).
5. **Normalized Item Shape**:
   ```typescript
   interface UniqueItem {
     id: string;          // slugified name
     name: string;        // "Tabula Rasa"
     baseType: string;    // "Simple Robe"
     category: UniqueCategory; // "Armour" | "Weapon" | "Accessory" | "Flask" | "Jewel" | "Tincture"
     chaosValue: number;  // baseline chaos value (e.g. 2.0)
     divineValue: number; // calculated or poe.ninja divine value
     icon: string;        // image URL
     listingCount: number;// active listings
     variantCount: number;// number of variants grouped
     isReplica: boolean;  // whether it's a Replica item
   }
   ```
6. **Default Sorting**: Items are sorted by default in **ascending order by `chaosValue`** (cheapest to most expensive).

---

## 4. Path of Exile 1 Regex Engine & Optimization Algorithm

### Constraints & In-game Behavior
- PoE 1 stash search enforces a **strict 250-character limit** per search query.
- Wrap full regex in double quotes: `"..."`.
- PoE search is case-insensitive; output must be strictly lowercase.
- Only special regex characters must be escaped: `\ . ( ) + ? [ ] ^ $ * { } |`. Safe characters such as `'`, `-`, `,`, and spaces are unescaped to preserve characters.

### Match Modes
1. **Reward Only (Default)**:
   - Matches the `Reward: <Item>` line on the Inscribed Ultimatum tooltip.
   - Standard syntax: `"reward: .*(item1|item2)"`
   - Compact syntax: `"d: .*(item1|item2)"` (`d:` matches the end of `Reward: ` uniquely in the Ultimatum tooltip format).
2. **Sacrifice Only**:
   - Matches the `Requires Sacrifice: <Item>` line.
   - Standard syntax: `"sacrifice: .*(item1|item2)"`
   - Compact syntax: `"ce: .*(item1|item2)"` (`ce:` matches the end of `Requires Sacrifice: `).
3. **Either (Reward or Sacrifice)**:
   - Matches anywhere on the item tooltip: `"(item1|item2)"`

### Regex Compression: Shortest Unique Substring Algorithm
When "Shortest Unique Substring" mode is enabled:
1. For each selected item $S \in \text{Selected}$:
   - Let $N = S.name.toLowerCase()$.
   - Generate all candidate substrings $w$ of $N$ with length $L \ge 3$, sorted by length ascending, then by number of regex special characters ascending.
   - Test if $w$ matches any unselected item $U \in \text{LoadedDataset} \setminus \text{Selected}$.
   - Test if $w$ collides with standard Inscribed Ultimatum tooltip static keywords:
     `{"inscribed", "ultimatum", "challenge", "survive", "protect", "altar", "defeat", "waves", "area", "level", "requires", "sacrifice", "reward"}`.
   - If $w$ has zero collisions with unselected items and zero collisions with static keywords, $w$ is the optimal unique token for item $S$.
   - If no valid substring of length $< |N|$ is found, fall back to the escaped full name of $S$.
2. Escape regex characters in the chosen token.
3. Combine all tokens using `|`.

### 250-Character Overflow & Greedy Chunking
1. Prefix & Suffix length overhead:
   - For example, `"reward: .*(...) "` has prefix `"reward: .*(` (11 chars) and suffix `)"` (2 chars), total fixed overhead = 13 chars. Max payload per chunk = $250 - 13 = 237$ chars.
2. Items are packed greedily into chunks:
   - Chunk #1: `"prefix(token1|token2|...|tokenK)suffix"` ($\le 250$ chars).
   - Chunk #2: `"prefix(tokenK+1|...|tokenM)suffix"` ($\le 250$ chars).
3. Each chunk is displayed in the UI with its own character count badge and independent copy button.

---

## 5. UI/UX Design & ARPG Aesthetic
- **Color Palette**:
  - Background: Deep Obsidian (`#0b0d11`, `#11141c`, `#171b26`).
  - Borders: Dark Slate / Muted Gold (`#262d3d`, `#3b3224`).
  - Accents: PoE Unique Orange (`#af6025`, `#c9772f`, `#e59133`) and PoE Gold (`#e0b35e`).
  - Text: Clean Off-White (`#e2e8f0`) with muted Secondary (`#94a3b8`).
  - Regex Display: JetBrains Mono / Monospace with glowing gold border and syntax highlighting.
- **Components**:
  - **Top Sticky Regex Bar**: Instant output, live character counter, match mode toggles, compression switch, copy button with animated toast notification.
  - **Filter Controls**: Search input (item/base name), category chips with active icons, price range filter (Chaos/Divine), quick price presets (e.g., "1c–5c Cheap Sacrifices", "50c+ High Value"), and "Select All Filtered" / "Clear Selection" buttons.
  - **Item Grid/Table**: Sorted ascending by Chaos price by default. Columns: Checkbox, Thumbnail, Item Name (with Replica badge if applicable), Base Type, Category, Chaos Price, Divine Price, Listing Count.
  - **Live Regex Tester Modal**: Interactive tool that lets players test their generated regex against real or custom Inscribed Ultimatum tooltips with visual pass/fail badges and highlighted match tokens.

---

## 6. Verification & Test Plan
1. **Vitest Unit Tests**:
   - `server/src/__tests__/deduplication.test.ts`: Foil exclusion (`itemClass: 9`), 5L/6L filtering, lowest price variant selection.
   - `client/src/__tests__/regexEngine.test.ts`: Character escaping, double quote wrapping, 250-char chunking, prefix/suffix mode handling.
   - `client/src/__tests__/compression.test.ts`: Shortest unique substring generation, verification that substring does not collide with unselected dataset or tooltip keywords.
   - `client/src/__tests__/ultimatumMatcher.test.ts`: Regex evaluation against authentic Inscribed Ultimatum strings ("Requires Sacrifice: Kaom's Sign" vs "Reward: Kaom's Sign").
2. **End-to-End Verification**:
   - Start backend and frontend via single `npm run dev` script.
   - Fetch live leagues and unique items from `poe.ninja` in the browser.
   - Filter and select items, observe regex generation, test "Select All Filtered" for cheap sacrifices (1-5c), test chunking with 20+ items, test live Inscribed Ultimatum tester modal.
