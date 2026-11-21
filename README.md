# PoE 1 Inscribed Ultimatum Regex Builder

A full-stack ARPG-themed web application for Path of Exile 1 players to generate character-optimized in-game stash search regex strings for Unique items, driven by real-time market prices from **poe.ninja**.

---

## ⚔ Features

- **Live poe.ninja Pricing**:
  - Automatically fetches active PoE 1 leagues (e.g. current Challenge League, Standard, Hardcore).
  - Fetches and aggregates across all 6 PoE 1 Unique categories: `Weapons`, `Armour`, `Accessories`, `Flasks`, `Jewels`, and `Tinctures`.
  - **In-Memory Caching (20-min TTL)**: Avoids rate limits with automatic cache eviction, visual "Last updated X min ago" indicator, and a manual force-refresh button.
- **Smart Deduplication & Normalization**:
  - **Excludes Foils** (`itemClass === 9`) and linked variants (`links >= 5`, e.g. 5L/6L body armours/weapons) to prevent price inflation.
  - Groups variants with identical names and selects the **lowest baseline non-zero Chaos price** (perfect for Inscribed Ultimatum sacrifices and rewards).
  - Identifies **Replica items** with distinct badges and dedicated toggle filters.
  - **Default Sorting**: Sorted in **ascending order by Chaos value** (cheapest to most expensive), with toggleable Ascending/Descending sorts across all columns.
- **PoE 1 Inscribed Ultimatum Regex Engine**:
  - **Strict 250-character limit** enforcement per search query.
  - Automatically wraps search strings in double quotes `"... "` for exact PoE stash regex matching.
  - Safely escapes regex special characters (`.`, `(`, `)`, `+`, `?`, `[`, `]`, `^`, `$`, `*`, `{`, `}`, `|`, `\`) while keeping safe characters (`'`, `-`, `,`, spaces) unescaped.
  - **Match Modes**:
    - **Reward Only (Default)**: `"reward: .*(item1|item2)"` (or compact `"d: .*(item1|item2)"`).
    - **Sacrifice Only**: `"sacrifice: .*(item1|item2)"` (or compact `"ce: .*(item1|item2)"`).
    - **Either / Any**: `"(item1|item2)"`.
  - **Shortest Unique Substring (Smart Shorten)**:
    - Calculates the shortest collision-free substring (&ge; 3 chars) of an item's lowercase name that matches the selected item and does **not** match any unselected item in the loaded database.
    - Prevents collisions with static Inscribed Ultimatum tooltip keywords (`inscribed`, `ultimatum`, `challenge`, `survive`, `protect`, `altar`, `defeat`, `waves`, `area`, `level`, `requires`, `sacrifice`, `reward`, `trialmaster`).
  - **Automatic 250-Character Overflow Chunking**:
    - Real-time character counter (`X / 250 chars`) with color-coded warning states (green, amber, red).
    - If selections exceed 250 characters, automatically splits items into **Regex #1, Regex #2, etc.** (each &le; 250 chars) with individual one-click Copy buttons and a "Copy All" utility.
- **Bulk Selection & Filters**:
  - Instant text filter by item name or base type.
  - Category chips with active item counts.
  - Price Range filters (Min/Max in Chaos or Divines) and quick presets (e.g. *Cheap Sacrifices 1–5c*, *Mid Sacrifices 5–20c*, *Valuable Rewards 50c+*, *1+ Div*).
  - **"Select All Filtered"** button for instant 1-click regex generation of entire price brackets.
- **Built-in Live Regex Tester**:
  - Interactive modal with sample Inscribed Ultimatum tooltips (testing `Requires Sacrifice:` vs `Reward:` edge cases).
  - Custom tooltip text editor with live regex evaluation, visual line highlighting in PoE gold/orange, and match verdict feedback.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Vitest.
- **Backend / Proxy**: Node.js, Express, TypeScript, native Fetch with fallback endpoints, In-Memory TTL Cache.
- **Orchestration**: Root `package.json` with `concurrently` running both services simultaneously.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js &ge; 18
- npm

### 2. Installation
Install all dependencies across root, server, and client:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Run Development Server
Start both backend (port 3001) and frontend (port 5173) in one command:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Build for Production
```bash
npm run build
```

### 5. Run Unit Tests
```bash
npm test
```
Runs 21+ unit tests verifying deduplication, regex escaping, 250-char chunking, shortest unique substring collision avoidance, and Inscribed Ultimatum matching accuracy.

---

## 📂 Project Architecture

```
f:\IUSorter\
├── package.json               # Root scripts (dev, build, test)
├── implementation_plan.md     # Architectural & algorithmic specification
├── README.md                  # Documentation & usage guide
├── server/                    # Node.js + Express API Proxy
│   ├── src/
│   │   ├── index.ts           # Express endpoints (/api/leagues, /api/uniques)
│   │   ├── cache.ts           # 20-min in-memory TTL cache
│   │   ├── poeService.ts      # poe.ninja fetchers, deduplication & normalization
│   │   └── types.ts           # Shared data interfaces
│   ├── package.json
│   └── tsconfig.json
└── client/                    # Vite + React + Tailwind Frontend
    ├── src/
    │   ├── components/
    │   │   ├── Header.tsx            # League selector, timer, refresh, modal trigger
    │   │   ├── RegexBar.tsx          # Sticky regex output, live counter, copy, modes
    │   │   ├── FilterControls.tsx    # Search, category chips, price ranges, bulk select
    │   │   ├── ItemTable.tsx         # Ascending price table, pagination, selection
    │   │   └── RegexTesterModal.tsx  # Inscribed Ultimatum mock tester & visualizer
    │   ├── services/
    │   │   ├── api.ts                # API client
    │   │   ├── regexEngine.ts        # PoE 1 regex generation & substring optimizer
    │   │   └── types.ts              # Frontend types
    │   ├── __tests__/
    │   │   ├── deduplication.test.ts # Tests for foil/link filtering and grouping
    │   │   └── regexEngine.test.ts   # Tests for escaping, chunking, and matching
    │   ├── App.tsx                   # Main state & view composition
    │   ├── main.tsx
    │   └── index.css                 # Tailwind ARPG dark theme styles
    ├── vite.config.ts                # Vite config with /api proxy to localhost:3001
    ├── tailwind.config.js
    └── package.json
```

---

## 📜 License
MIT
