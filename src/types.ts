export type Universe = {
  name: string;
  color: string;
};

export type Hero = {
  id: string;
  name: string;
  secret_identity: string;
  universe: string;
  alignment: string;
  description: string;
  wins: number;
  losses: number;
  image_url: string;
  hero_type: string;
  health: number;
  speed: number;
  strength: number;
  teams?: string[];
  powers?: string[];
};

export type Match = {
  id: string;
  hero1_name: string;
  hero2_name: string;
  winner_name: string;
  arena_name: string;
  match_date: string;
};

export type Arena = {
  id: string;
  name: string;
  location_type: string;
};

export type LeaderboardEntry = {
  name: string;
  universe: string;
  wins: number;
  losses: number;
  win_rate: number;
};
