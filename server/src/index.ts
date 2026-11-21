import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MemoryCache } from './cache.js';
import { fetchAllUniques, fetchLeagues } from './poeService.js';
import { LeagueInfo, UniqueItem, UniquesResponse } from './types.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

app.use(cors());
app.use(express.json());

// 20-minute memory cache for unique items
const uniquesCache = new MemoryCache<UniqueItem[]>(20);
// 1-hour memory cache for leagues
const leaguesCache = new MemoryCache<LeagueInfo[]>(60);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/leagues', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';

  if (!forceRefresh) {
    const cached = leaguesCache.get('leagues');
    if (cached) {
      return res.json({
        cached: true,
        fetchedAt: new Date(cached.fetchedAt).toISOString(),
        leagues: cached.data,
      });
    }
  }

  try {
    const leagues = await fetchLeagues();
    leaguesCache.set('leagues', leagues);

    res.json({
      cached: false,
      fetchedAt: new Date().toISOString(),
      leagues,
    });
  } catch (err) {
    console.error('Error fetching leagues:', err);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

app.get('/api/uniques', async (req, res) => {
  const league = (req.query.league as string) || 'Standard';
  const forceRefresh = req.query.refresh === 'true';

  const cacheKey = `uniques-${league}`;

  if (!forceRefresh) {
    const cached = uniquesCache.get(cacheKey);
    if (cached) {
      const response: UniquesResponse = {
        league,
        cached: true,
        fetchedAt: new Date(cached.fetchedAt).toISOString(),
        ageSeconds: cached.ageSeconds,
        totalCount: cached.data.length,
        items: cached.data,
      };
      return res.json(response);
    }
  }

  try {
    console.log(`[poeService] Fetching unique items for league "${league}"...`);
    const items = await fetchAllUniques(league);
    uniquesCache.set(cacheKey, items);

    const response: UniquesResponse = {
      league,
      cached: false,
      fetchedAt: new Date().toISOString(),
      ageSeconds: 0,
      totalCount: items.length,
      items,
    };

    console.log(
      `[poeService] Successfully fetched & normalized ${items.length} unique items for "${league}"`
    );
    res.json(response);
  } catch (err) {
    console.error(`Error fetching uniques for ${league}:`, err);
    res.status(500).json({ error: 'Failed to fetch unique items from poe.ninja' });
  }
});

// Serve production static frontend if client/dist exists
if (fs.existsSync(clientDistPath)) {
  console.log(`[Server] Serving production client from ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] PoE 1 Inscribed Ultimatum API running at http://localhost:${PORT}`);
});
