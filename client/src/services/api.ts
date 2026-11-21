import { LeagueInfo, UniquesApiResponse } from './types.js';

export async function fetchLeagues(): Promise<{
  leagues: LeagueInfo[];
  cached: boolean;
  fetchedAt: string;
}> {
  const res = await fetch('/api/leagues');
  if (!res.ok) {
    throw new Error(`Failed to fetch leagues: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchUniques(
  league: string,
  refresh: boolean = false
): Promise<UniquesApiResponse> {
  const url = `/api/uniques?league=${encodeURIComponent(league)}${
    refresh ? '&refresh=true' : ''
  }`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch unique items: ${res.statusText}`);
  }
  return res.json();
}
