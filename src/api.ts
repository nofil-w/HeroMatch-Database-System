import { Hero, Match, LeaderboardEntry, Arena } from './types';

export async function fetchHeroes(q = '', team = 'all', universe = 'all'): Promise<Hero[]> {
  const url = new URL('/api/heroes', window.location.origin);
  if (q) url.searchParams.set('q', q);
  if (team !== 'all') url.searchParams.set('team', team);
  if (universe !== 'all') url.searchParams.set('universe', universe);
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  return res.json().then(data => Array.isArray(data) ? data : []);
}

export async function fetchTeams(): Promise<{id: string; name: string}[]> {
  const res = await fetch('/api/teams');
  if (!res.ok) return [];
  return res.json().then(data => Array.isArray(data) ? data : []);
}

export interface Universe {
  name: string;
  color: string;
}

export async function fetchUniverses(): Promise<Universe[]> {
  const res = await fetch('/api/universes');
  if (!res.ok) return [];
  return res.json().then(data => Array.isArray(data) ? data : []);
}

export async function fetchRoles(): Promise<string[]> {
  const res = await fetch('/api/roles');
  if (!res.ok) return [];
  return res.json().then(data => Array.isArray(data) ? data : []);
}

export async function fetchPowers(): Promise<string[]> {
  const res = await fetch('/api/powers');
  if (!res.ok) return [];
  return res.json().then(data => Array.isArray(data) ? data : []);
}

export async function createTag(name: string, type: 'universe' | 'role' | 'power', color?: string) {
  return fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name, type, color })
  }).then(r => r.json());
}

export async function updateTag(oldName: string, newName: string, type: 'universes' | 'roles' | 'powers' | 'teams', color?: string) {
  const res = await fetch('/api/tags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ oldName, newName, type, color })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
  return res.json();
}

export async function deleteTag(name: string, type: 'universes' | 'roles' | 'powers' | 'teams') {
  const res = await fetch('/api/tags', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name, type })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch('/api/users', { headers: getAuthHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function revealPassword(targetUserId: string, adminPassword: string) {
  const res = await fetch('/api/users/reveal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ targetUserId, adminPassword })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
  return res.json();
}

export async function registerAdmin(username: string, password: string) {
  const res = await fetch('/api/users/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
  return res.json();
}

export async function fetchArenas(): Promise<Arena[]> {
  return fetch('/api/arenas').then(r => r.json());
}

export async function fetchHero(id: string): Promise<Hero> {
  return fetch(`/api/heroes/${id}`).then(r => r.json());
}

export async function fetchMatches(): Promise<Match[]> {
  return fetch('/api/matches').then(r => r.json());
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export async function saveMatch(data: { hero1_id: string, hero2_id: string, winner_id: string, arena_id: string }) {
  return fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return fetch('/api/leaderboard').then(r => r.json());
}

export async function submitRegister(data: any) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function submitLogin(data: any) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function fetchMe() {
  const res = await fetch('/api/me', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Not logged in');
  return res.json();
}

export async function createHero(data: any) {
  const res = await fetch('/api/heroes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function updateHero(id: string, data: any) {
  const res = await fetch(`/api/heroes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteHero(id: string) {
  const res = await fetch(`/api/heroes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
