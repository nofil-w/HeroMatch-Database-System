import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('hero-match.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS heroes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    secret_identity TEXT,
    universe TEXT NOT NULL,
    alignment TEXT,
    description TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    image_url TEXT,
    hero_type TEXT NOT NULL,
    health INTEGER CHECK(health BETWEEN 0 AND 100),
    speed INTEGER CHECK(speed BETWEEN 0 AND 100),
    strength INTEGER CHECK(strength BETWEEN 0 AND 100)
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hero_teams (
    hero_id TEXT,
    team_id TEXT,
    PRIMARY KEY (hero_id, team_id),
    FOREIGN KEY(hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS arenas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location_type TEXT
  );

  CREATE TABLE IF NOT EXISTS powers (
    id TEXT PRIMARY KEY,
    power_name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS hero_powers (
    hero_id TEXT,
    power_id TEXT,
    PRIMARY KEY (hero_id, power_id),
    FOREIGN KEY(hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
    FOREIGN KEY(power_id) REFERENCES powers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    hero1_id TEXT,
    hero2_id TEXT,
    winner_id TEXT,
    arena_id TEXT,
    match_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(hero1_id) REFERENCES heroes(id) ON DELETE CASCADE,
    FOREIGN KEY(hero2_id) REFERENCES heroes(id) ON DELETE CASCADE,
    FOREIGN KEY(winner_id) REFERENCES heroes(id) ON DELETE CASCADE,
    FOREIGN KEY(arena_id) REFERENCES arenas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    plain_password TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS universes (
    name TEXT PRIMARY KEY,
    color TEXT DEFAULT '#3b82f6'
  );

  CREATE TABLE IF NOT EXISTS roles (
    name TEXT PRIMARY KEY
  );

  CREATE TRIGGER IF NOT EXISTS update_hero_stats_after_match
  AFTER INSERT ON matches
  BEGIN
    UPDATE heroes SET wins = wins + 1 WHERE id = NEW.winner_id;
    UPDATE heroes SET losses = losses + 1 WHERE id = CASE WHEN NEW.hero1_id = NEW.winner_id THEN NEW.hero2_id ELSE NEW.hero1_id END;
  END;

  CREATE VIEW IF NOT EXISTS Leaderboard AS
  SELECT 
    name, 
    universe, 
    wins, 
    losses, 
    CASE 
      WHEN (wins + losses) = 0 THEN 0.0 
      ELSE CAST(wins AS FLOAT) * 100.0 / (wins + losses) 
    END AS win_rate
  FROM heroes
  ORDER BY win_rate DESC, wins DESC;
`);

try {
  db.exec("ALTER TABLE universes ADD COLUMN color TEXT DEFAULT '#3b82f6'");
} catch (e) {
  // Ignore error if column already exists
}

// Only seed if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM heroes');
const row: any = countStmt.get();

if (row.count === 0) {
  // Seed data
  const insertHero = db.prepare(`
    INSERT INTO heroes (id, name, secret_identity, universe, alignment, description, wins, losses, image_url, hero_type, health, speed, strength)
    VALUES (@id, @name, @secret_identity, @universe, @alignment, @description, @wins, @losses, @image_url, @hero_type, @health, @speed, @strength)
  `);

  const insertTeam = db.prepare(`INSERT INTO teams (id, name) VALUES (@id, @name)`);
  const insertHeroTeam = db.prepare(`INSERT INTO hero_teams (hero_id, team_id) VALUES (@hero_id, @team_id)`);
  const insertArena = db.prepare(`INSERT INTO arenas (id, name, location_type) VALUES (@id, @name, @location_type)`);
  const insertPower = db.prepare(`INSERT INTO powers (id, power_name, description) VALUES (@id, @power_name, @description)`);
  const insertHeroPower = db.prepare(`INSERT INTO hero_powers (hero_id, power_id) VALUES (@hero_id, @power_id)`);
  const insertMatch = db.prepare(`INSERT INTO matches (id, hero1_id, hero2_id, winner_id, arena_id) VALUES (@id, @hero1_id, @hero2_id, @winner_id, @arena_id)`);

const heroes = [
  { id: 'h1', name: 'Superman', secret_identity: 'Clark Kent', universe: 'DC', alignment: 'Good', description: 'The Last Son of Krypton.', wins: 152, losses: 12, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/644-superman.jpg', hero_type: 'flight', health: 100, speed: 99, strength: 100 },
  { id: 'h2', name: 'Batman', secret_identity: 'Bruce Wayne', universe: 'DC', alignment: 'Good', description: 'The Dark Knight of Gotham.', wins: 145, losses: 20, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/69-batman.jpg', hero_type: 'strength', health: 60, speed: 65, strength: 70 },
  { id: 'h3', name: 'Wonder Woman', secret_identity: 'Diana Prince', universe: 'DC', alignment: 'Good', description: 'Amazonian princess.', wins: 138, losses: 15, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/720-wonder-woman.jpg', hero_type: 'flight', health: 90, speed: 85, strength: 95 },
  { id: 'h4', name: 'Spider-Man', secret_identity: 'Peter Parker', universe: 'Marvel', alignment: 'Good', description: 'Bitten by a radioactive spider.', wins: 121, losses: 30, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/620-spider-man.jpg', hero_type: 'speed', health: 70, speed: 90, strength: 65 },
  { id: 'h5', name: 'Iron Man', secret_identity: 'Tony Stark', universe: 'Marvel', alignment: 'Good', description: 'Genius billionaire in a suit.', wins: 110, losses: 22, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/346-iron-man.jpg', hero_type: 'flight', health: 75, speed: 85, strength: 80 },
  { id: 'h6', name: 'Captain America', secret_identity: 'Steve Rogers', universe: 'Marvel', alignment: 'Good', description: 'The First Avenger.', wins: 130, losses: 18, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/149-captain-america.jpg', hero_type: 'strength', health: 80, speed: 70, strength: 85 },
  { id: 'h7', name: 'The Flash', secret_identity: 'Barry Allen', universe: 'DC', alignment: 'Good', description: 'The fastest man alive.', wins: 115, losses: 25, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/263-flash.jpg', hero_type: 'speed', health: 60, speed: 100, strength: 55 },
  { id: 'h8', name: 'Thor', secret_identity: 'Thor Odinson', universe: 'Marvel', alignment: 'Good', description: 'The God of Thunder.', wins: 140, losses: 15, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/659-thor.jpg', hero_type: 'flight', health: 95, speed: 80, strength: 100 },
  { id: 'h9', name: 'Hulk', secret_identity: 'Bruce Banner', universe: 'Marvel', alignment: 'Good', description: 'A massive green behemoth.', wins: 125, losses: 20, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/332-hulk.jpg', hero_type: 'strength', health: 100, speed: 60, strength: 100 },
  { id: 'h10', name: 'Aquaman', secret_identity: 'Arthur Curry', universe: 'DC', alignment: 'Good', description: 'King of Atlantis.', wins: 105, losses: 30, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/38-aquaman.jpg', hero_type: 'strength', health: 85, speed: 75, strength: 85 },
  { id: 'h11', name: 'Wolverine', secret_identity: 'Logan', universe: 'Marvel', alignment: 'Good', description: 'A mutant with rapid healing.', wins: 135, losses: 40, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/717-wolverine.jpg', hero_type: 'strength', health: 95, speed: 70, strength: 75 },
  { id: 'h12', name: 'Black Widow', secret_identity: 'Natasha Romanoff', universe: 'Marvel', alignment: 'Good', description: 'A highly trained spy.', wins: 95, losses: 15, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/107-black-widow.jpg', hero_type: 'speed', health: 55, speed: 75, strength: 45 },
  { id: 'h13', name: 'Doctor Strange', secret_identity: 'Stephen Strange', universe: 'Marvel', alignment: 'Good', description: 'Sorcerer Supreme.', wins: 85, losses: 15, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/226-doctor-strange.jpg', hero_type: 'flight', health: 70, speed: 70, strength: 40 },
  { id: 'h14', name: 'Thanos', secret_identity: 'Thanos', universe: 'Marvel', alignment: 'Evil', description: 'The Mad Titan.', wins: 200, losses: 30, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/655-thanos.jpg', hero_type: 'strength', health: 100, speed: 65, strength: 100 },
  { id: 'h15', name: 'Darkseid', secret_identity: 'Uxas', universe: 'DC', alignment: 'Evil', description: 'Tyrant of Apokolips.', wins: 210, losses: 25, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/204-darkseid.jpg', hero_type: 'strength', health: 100, speed: 70, strength: 100 },
  { id: 'h16', name: 'Magneto', secret_identity: 'Max Eisenhardt', universe: 'Marvel', alignment: 'Neutral', description: 'Master of Magnetism.', wins: 150, losses: 45, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/423-magneto.jpg', hero_type: 'flight', health: 70, speed: 65, strength: 45 },
  { id: 'h17', name: 'Green Lantern', secret_identity: 'Hal Jordan', universe: 'DC', alignment: 'Good', description: 'Wielder of the power ring.', wins: 130, losses: 35, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/306-hal-jordan.jpg', hero_type: 'flight', health: 80, speed: 90, strength: 80 },
  { id: 'h18', name: 'Joker', secret_identity: 'Unknown', universe: 'DC', alignment: 'Evil', description: 'The Clown Prince of Crime.', wins: 110, losses: 90, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/370-joker.jpg', hero_type: 'speed', health: 50, speed: 60, strength: 30 },
  { id: 'h19', name: 'Scarlet Witch', secret_identity: 'Wanda Maximoff', universe: 'Marvel', alignment: 'Neutral', description: 'Reality-altering mutant.', wins: 140, losses: 20, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/579-scarlet-witch.jpg', hero_type: 'flight', health: 65, speed: 60, strength: 35 },
  { id: 'h20', name: 'Cyborg', secret_identity: 'Victor Stone', universe: 'DC', alignment: 'Good', description: 'Half-man, half-machine.', wins: 95, losses: 40, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/194-cyborg.jpg', hero_type: 'strength', health: 85, speed: 65, strength: 85 },
  { id: 'h21', name: 'Jean Grey', secret_identity: 'Jean Grey', universe: 'Marvel', alignment: 'Good', description: 'Omega-level mutant.', wins: 160, losses: 10, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/356-jean-grey.jpg', hero_type: 'flight', health: 65, speed: 65, strength: 40 },
  { id: 'h22', name: 'Shazam', secret_identity: 'Billy Batson', universe: 'DC', alignment: 'Good', description: 'Earths Mightiest Mortal.', wins: 120, losses: 25, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/156-captain-marvel.jpg', hero_type: 'flight', health: 95, speed: 95, strength: 95 },
  { id: 'h23', name: 'Deadpool', secret_identity: 'Wade Wilson', universe: 'Marvel', alignment: 'Neutral', description: 'The Merc with a Mouth.', wins: 180, losses: 150, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/213-deadpool.jpg', hero_type: 'speed', health: 100, speed: 75, strength: 60 },
  { id: 'h24', name: 'Lex Luthor', secret_identity: 'Lex Luthor', universe: 'DC', alignment: 'Evil', description: 'Billionaire genius and arch-nemesis.', wins: 100, losses: 120, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/405-lex-luthor.jpg', hero_type: 'strength', health: 80, speed: 50, strength: 85 },
  { id: 'h25', name: 'Venom', secret_identity: 'Eddie Brock', universe: 'Marvel', alignment: 'Evil', description: 'Vigilante; former journalist for the Daily Globe, government operative', wins: 80, losses: 40, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/687-venom.jpg', hero_type: 'strength', health: 84, speed: 65, strength: 57 },
  { id: 'h26', name: 'Bane', secret_identity: 'Bane', universe: 'DC', alignment: 'Evil', description: 'Mercenary', wins: 70, losses: 30, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/60-bane.jpg', hero_type: 'strength', health: 56, speed: 23, strength: 68 },
  { id: 'h27', name: 'Black Panther', secret_identity: "T'Challa", universe: 'Marvel', alignment: 'Good', description: 'King and Chieftain of Wakanda', wins: 140, losses: 20, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/106-black-panther.jpg', hero_type: 'speed', health: 60, speed: 30, strength: 56 },
  { id: 'h28', name: 'Loki', secret_identity: 'Loki Laufeyson', universe: 'Marvel', alignment: 'Evil', description: 'God of evil; former god of mischief and madness', wins: 150, losses: 100, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/414-loki.jpg', hero_type: 'flight', health: 85, speed: 46, strength: 63 },
  { id: 'h29', name: 'Green Arrow', secret_identity: 'Oliver Queen', universe: 'DC', alignment: 'Good', description: 'Professional Crime-fighter; Multi-Billionaire', wins: 110, losses: 40, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/298-green-arrow.jpg', hero_type: 'speed', health: 28, speed: 35, strength: 12 },
  { id: 'h30', name: 'Daredevil', secret_identity: 'Matt Murdock', universe: 'Marvel', alignment: 'Good', description: 'Adventurer, vigilante, Attorney at Law', wins: 120, losses: 50, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/201-daredevil.jpg', hero_type: 'speed', health: 35, speed: 25, strength: 13 },
  { id: 'h31', name: 'Punisher', secret_identity: 'Frank Castle', universe: 'Marvel', alignment: 'Good', description: 'Former United States Marine turned professional vigilante', wins: 95, losses: 35, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/530-punisher.jpg', hero_type: 'speed', health: 45, speed: 21, strength: 16 },
  { id: 'h32', name: 'Ghost Rider', secret_identity: 'Johnny Blaze', universe: 'Marvel', alignment: 'Good', description: 'Former stunt motorcyclist', wins: 160, losses: 20, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/280-ghost-rider.jpg', hero_type: 'speed', health: 100, speed: 25, strength: 55 },
  { id: 'h33', name: 'Silver Surfer', secret_identity: 'Norrin Radd', universe: 'Marvel', alignment: 'Good', description: "Adventurer, formerly Galactus' Herald", wins: 210, losses: 10, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/598-silver-surfer.jpg', hero_type: 'flight', health: 90, speed: 100, strength: 100 },
  { id: 'h34', name: 'Nightwing', secret_identity: 'Dick Grayson', universe: 'Marvel', alignment: 'Good', description: 'Vigilante and detective', wins: 130, losses: 30, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/491-nightwing.jpg', hero_type: 'speed', health: 28, speed: 33, strength: 21 },
  { id: 'h35', name: 'Robin', secret_identity: 'Dick Grayson', universe: 'Marvel', alignment: 'Good', description: 'Sidekick', wins: 80, losses: 40, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/561-robin.jpg', hero_type: 'speed', health: 28, speed: 27, strength: 11 },
  { id: 'h36', name: 'Doctor Doom', secret_identity: 'Victor von Doom', universe: 'Marvel', alignment: 'Evil', description: 'Monarch', wins: 190, losses: 30, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/222-doctor-doom.jpg', hero_type: 'strength', health: 100, speed: 20, strength: 90 },
  { id: 'h37', name: 'Martian Manhunter', secret_identity: "J'onn J'onzz", universe: 'DC', alignment: 'Good', description: 'Alien Hero', wins: 160, losses: 15, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/432-martian-manhunter.jpg', hero_type: 'flight', health: 100, speed: 92, strength: 95 },
  { id: 'h38', name: 'Groot', secret_identity: 'Groot', universe: 'Marvel', alignment: 'Good', description: 'Sapien Tree', wins: 90, losses: 30, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/303-groot.jpg', hero_type: 'strength', health: 70, speed: 33, strength: 85 },
  { id: 'h39', name: 'Star-Lord', secret_identity: 'Peter Jason Quill', universe: 'Marvel', alignment: 'Good', description: 'Adventurer; Royal Prince of Spartax', wins: 85, losses: 45, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/630-star-lord.jpg', hero_type: 'speed', health: 50, speed: 33, strength: 20 },
  { id: 'h40', name: 'Captain Marvel', secret_identity: 'Billy Batson', universe: 'DC', alignment: 'Good', description: '-', wins: 144, losses: 59, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/156-captain-marvel.jpg', hero_type: 'speed', health: 95, speed: 88, strength: 100 },
  { id: 'h41', name: 'Ant-Man', secret_identity: 'Hank Pym', universe: 'Marvel', alignment: 'Good', description: 'Adventurer, Biochemist', wins: 148, losses: 33, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/30-ant-man.jpg', hero_type: 'flight', health: 28, speed: 23, strength: 18 },
  { id: 'h42', name: 'Hawkeye', secret_identity: 'Clint Barton', universe: 'Marvel', alignment: 'Good', description: 'Adventurer', wins: 147, losses: 23, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/313-hawkeye.jpg', hero_type: 'flight', health: 10, speed: 21, strength: 12 },
  { id: 'h43', name: 'Vision', secret_identity: 'Vision', universe: 'Marvel', alignment: 'Good', description: '-', wins: 53, losses: 52, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/697-vision.jpg', hero_type: 'strength', health: 95, speed: 54, strength: 72 },
  { id: 'h44', name: 'War Machine', secret_identity: 'James Rupert Rhodes', universe: 'Marvel', alignment: 'Good', description: 'Initiative instructor, adventurer', wins: 53, losses: 16, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/703-war-machine.jpg', hero_type: 'strength', health: 100, speed: 63, strength: 80 },
  { id: 'h45', name: 'Gamora', secret_identity: 'Gamora Zen Whoberi Ben Titan', universe: 'Marvel', alignment: 'Good', description: 'Assassin, mercenary, adventurer', wins: 144, losses: 36, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/275-gamora.jpg', hero_type: 'strength', health: 85, speed: 42, strength: 85 },
  { id: 'h46', name: 'Rocket Raccoon', secret_identity: 'Rocket Raccoon', universe: 'Marvel', alignment: 'Good', description: 'Law enforcement officer', wins: 94, losses: 33, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/566-rocket-raccoon.jpg', hero_type: 'flight', health: 28, speed: 23, strength: 5 },
  { id: 'h47', name: 'Shang-Chi', secret_identity: 'Shang-Chi', universe: 'Marvel', alignment: 'Good', description: '-', wins: 85, losses: 49, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/587-shang-chi.jpg', hero_type: 'flight', health: 50, speed: 30, strength: 12 },
  { id: 'h48', name: 'Blade', secret_identity: 'Eric Brooks', universe: 'Marvel', alignment: 'Good', description: 'Vampire hunter', wins: 86, losses: 10, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/112-blade.jpg', hero_type: 'flight', health: 50, speed: 38, strength: 28 },
  { id: 'h49', name: 'Moon Knight', secret_identity: 'Marc Spector', universe: 'Marvel', alignment: 'Good', description: 'Adventurer, entrepreneur', wins: 132, losses: 41, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/470-moon-knight.jpg', hero_type: 'flight', health: 42, speed: 23, strength: 36 },
  { id: 'h50', name: 'Cyclops', secret_identity: 'Scott Summers', universe: 'Marvel', alignment: 'Good', description: 'Leader of mutant race', wins: 76, losses: 38, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/196-cyclops.jpg', hero_type: 'flight', health: 42, speed: 23, strength: 10 },
  { id: 'h51', name: 'Storm', secret_identity: 'Ororo Munroe', universe: 'Marvel', alignment: 'Good', description: 'Adventurer', wins: 135, losses: 37, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/638-storm.jpg', hero_type: 'flight', health: 30, speed: 47, strength: 10 },
  { id: 'h52', name: 'Rogue', secret_identity: 'Anna Marie', universe: 'Marvel', alignment: 'Good', description: 'Adventurer', wins: 101, losses: 45, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/567-rogue.jpg', hero_type: 'flight', health: 28, speed: 12, strength: 10 },
  { id: 'h53', name: 'Gambit', secret_identity: 'Remy Etienne LeBeau', universe: 'Marvel', alignment: 'Good', description: 'Mutant adventurer', wins: 110, losses: 47, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/274-gambit.jpg', hero_type: 'flight', health: 28, speed: 23, strength: 10 },
  { id: 'h54', name: 'Beast', secret_identity: 'Henry Philip McCoy', universe: 'Marvel', alignment: 'Good', description: 'Biochemist', wins: 105, losses: 55, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/75-beast.jpg', hero_type: 'flight', health: 60, speed: 38, strength: 48 },
  { id: 'h55', name: 'Colossus', secret_identity: 'Piotr Nikolaievitch Rasputin', universe: 'Marvel', alignment: 'Good', description: 'Adventurer, student', wins: 123, losses: 17, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/185-colossus.jpg', hero_type: 'strength', health: 100, speed: 33, strength: 83 },
  { id: 'h56', name: 'Nightcrawler', secret_identity: 'Kurt Wagner', universe: 'Marvel', alignment: 'Good', description: 'Adventurer, Teacher', wins: 134, losses: 42, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/490-nightcrawler.jpg', hero_type: 'flight', health: 14, speed: 47, strength: 10 },
  { id: 'h57', name: 'Mystique', secret_identity: 'Raven Darkholme', universe: 'Marvel', alignment: 'Evil', description: 'Special operative', wins: 143, losses: 24, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/480-mystique.jpg', hero_type: 'flight', health: 64, speed: 23, strength: 12 },
  { id: 'h58', name: 'Sabretooth', secret_identity: 'Victor Creed', universe: 'Marvel', alignment: 'Evil', description: 'Mercenary', wins: 136, losses: 19, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/570-sabretooth.jpg', hero_type: 'flight', health: 90, speed: 38, strength: 48 },
  { id: 'h59', name: 'Doctor Octopus', secret_identity: 'Otto Octavius', universe: 'Marvel', alignment: 'Evil', description: 'Criminal mastermind', wins: 70, losses: 58, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/225-doctor-octopus.jpg', hero_type: 'flight', health: 40, speed: 33, strength: 48 },
  { id: 'h60', name: 'Green Goblin', secret_identity: 'Norman Osborn', universe: 'Marvel', alignment: 'Evil', description: 'Professional criminal', wins: 79, losses: 28, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/299-green-goblin.jpg', hero_type: 'flight', health: 60, speed: 38, strength: 48 },
  { id: 'h61', name: 'Kingpin', secret_identity: 'Wilson Grant Fisk', universe: 'Marvel', alignment: 'Evil', description: 'Criminal organizer', wins: 135, losses: 46, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/391-kingpin.jpg', hero_type: 'flight', health: 40, speed: 25, strength: 18 },
  { id: 'h62', name: 'Ultron', secret_identity: 'Ultron', universe: 'Marvel', alignment: 'Evil', description: 'Mass murderer, scientist', wins: 92, losses: 10, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/680-ultron.jpg', hero_type: 'strength', health: 100, speed: 42, strength: 83 },
  { id: 'h63', name: 'Supergirl', secret_identity: 'Kara Zor-El', universe: 'DC', alignment: 'Good', description: 'Crime-Fighter', wins: 89, losses: 42, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/643-supergirl.jpg', hero_type: 'speed', health: 100, speed: 100, strength: 100 },
  { id: 'h64', name: 'Batgirl', secret_identity: 'Barbara Gordon', universe: 'Marvel', alignment: 'Good', description: '-', wins: 79, losses: 55, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/63-batgirl.jpg', hero_type: 'flight', health: 40, speed: 33, strength: 11 },
  { id: 'h65', name: 'Red Hood', secret_identity: 'Jason Todd', universe: 'Marvel', alignment: 'Neutral', description: 'Mercenary, Vigilante', wins: 59, losses: 41, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/546-red-hood.jpg', hero_type: 'flight', health: 28, speed: 23, strength: 12 },
  { id: 'h66', name: 'Catwoman', secret_identity: 'Selina Kyle', universe: 'DC', alignment: 'Good', description: 'Thief', wins: 89, losses: 55, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/165-catwoman.jpg', hero_type: 'flight', health: 28, speed: 33, strength: 11 },
  { id: 'h67', name: 'Poison Ivy', secret_identity: 'Pamela Isley', universe: 'DC', alignment: 'Evil', description: 'Criminal, Botanist', wins: 142, losses: 23, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/522-poison-ivy.jpg', hero_type: 'flight', health: 40, speed: 21, strength: 14 },
  { id: 'h68', name: 'Harley Quinn', secret_identity: 'Harley Quinn', universe: 'DC', alignment: 'Evil', description: 'Psychiatrist', wins: 65, losses: 46, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/309-harley-quinn.jpg', hero_type: 'flight', health: 65, speed: 33, strength: 12 },
  { id: 'h69', name: 'Two-Face', secret_identity: 'Harvey Dent', universe: 'DC', alignment: 'Evil', description: 'Reformed criminal', wins: 50, losses: 49, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/678-two-face.jpg', hero_type: 'flight', health: 14, speed: 12, strength: 10 },
  { id: 'h70', name: 'Riddler', secret_identity: 'Edward Nigma', universe: 'DC', alignment: 'Evil', description: '-', wins: 125, losses: 10, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/558-riddler.jpg', hero_type: 'flight', health: 14, speed: 12, strength: 10 },
  { id: 'h71', name: 'Penguin', secret_identity: 'Oswald Chesterfield Cobblepot', universe: 'DC', alignment: 'Evil', description: 'Trader', wins: 114, losses: 59, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/514-penguin.jpg', hero_type: 'flight', health: 28, speed: 12, strength: 10 },
  { id: 'h72', name: 'Mister Freeze', secret_identity: 'Victor Fries', universe: 'DC', alignment: 'Evil', description: '-', wins: 65, losses: 14, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/457-mister-freeze.jpg', hero_type: 'flight', health: 70, speed: 12, strength: 32 },
  { id: 'h73', name: 'Black Adam', secret_identity: 'Teth-Adam', universe: 'DC', alignment: 'Evil', description: '-', wins: 94, losses: 33, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/95-black-adam.jpg', hero_type: 'speed', health: 100, speed: 92, strength: 100 },
  { id: 'h74', name: 'Zatanna', secret_identity: 'Zatanna Zatara', universe: 'DC', alignment: 'Good', description: '-', wins: 137, losses: 17, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/730-zatanna.jpg', hero_type: 'flight', health: 28, speed: 23, strength: 10 },
  { id: 'h75', name: 'Doctor Fate', secret_identity: 'Kent Nelson', universe: 'DC', alignment: 'Good', description: '-', wins: 117, losses: 28, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/224-doctor-fate.jpg', hero_type: 'flight', health: 80, speed: 25, strength: 16 },
  { id: 'h76', name: 'Blue Beetle', secret_identity: 'Jaime Reyes', universe: 'DC', alignment: 'Good', description: 'Student', wins: 133, losses: 46, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/126-blue-beetle-iii.jpg', hero_type: 'flight', health: 80, speed: 58, strength: 34 },
  { id: 'h77', name: 'Plastic Man', secret_identity: 'Patrick O\'Brian', universe: 'DC', alignment: 'Good', description: 'Government Agent', wins: 50, losses: 38, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/520-plastic-man.jpg', hero_type: 'flight', health: 100, speed: 23, strength: 63 },
  { id: 'h78', name: 'Swamp Thing', secret_identity: 'Alec Holland', universe: 'DC', alignment: 'Evil', description: 'Planet Elemental', wins: 62, losses: 35, image_url: 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/645-swamp-thing.jpg', hero_type: 'strength', health: 100, speed: 25, strength: 95 }
];

const teams = [
  { id: 't1', name: 'Justice League' },
  { id: 't2', name: 'Avengers' },
  { id: 't3', name: 'X-Men' }
];

const heroTeams = [
  { hero_id: 'h1', team_id: 't1' }, { hero_id: 'h2', team_id: 't1' }, { hero_id: 'h3', team_id: 't1' },
  { hero_id: 'h4', team_id: 't2' }, { hero_id: 'h5', team_id: 't2' }, { hero_id: 'h6', team_id: 't2' },
  { hero_id: 'h7', team_id: 't1' }, { hero_id: 'h8', team_id: 't2' }, { hero_id: 'h9', team_id: 't2' },
  { hero_id: 'h10', team_id: 't1' }, { hero_id: 'h11', team_id: 't3' }, { hero_id: 'h12', team_id: 't2' },
  { hero_id: 'h13', team_id: 't2' }, { hero_id: 'h16', team_id: 't3' }, { hero_id: 'h17', team_id: 't1' },
  { hero_id: 'h19', team_id: 't2' }, { hero_id: 'h20', team_id: 't1' }, { hero_id: 'h21', team_id: 't3' },
  { hero_id: 'h22', team_id: 't1' }
];

const arenas = [
  { id: 'a1', name: 'Metropolis City Center', location_type: 'Urban' },
  { id: 'a2', name: 'Gotham Rooftops', location_type: 'Urban Night' },
  { id: 'a3', name: 'Stark Tower Landing Pad', location_type: 'High Altitude' },
  { id: 'a4', name: 'Wakandan Jungle', location_type: 'Wilderness' }
];

const powers = [
  { id: 'p_flight', power_name: 'Flight', description: 'Ability to fly' },
  { id: 'p_str', power_name: 'Super Strength', description: 'Incredible physical might' },
  { id: 'p_spd', power_name: 'Super Speed', description: 'Move at incredible velocity' },
  { id: 'p_heat', power_name: 'Heat Vision', description: 'Fire heat beams from eyes' },
  { id: 'p_invul', power_name: 'Invulnerability', description: 'Immune to physical damage' },
  { id: 'p_freeze', power_name: 'Freeze Breath', description: 'Exhale freezing gusts of wind' },
  { id: 'p_martial', power_name: 'Martial Arts', description: 'Mastery of hand-to-hand combat' },
  { id: 'p_gadget', power_name: 'Gadgets', description: 'Utilizes advanced technological tools' },
  { id: 'p_intel', power_name: 'Genius Intellect', description: 'Extraordinary mental capacity' },
  { id: 'p_stealth', power_name: 'Stealth', description: 'Move unseen and unheard' },
  { id: 'p_web', power_name: 'Web-Shooting', description: 'Shoot synthetic spider-webs' },
  { id: 'p_wall', power_name: 'Wall-Crawling', description: 'Climb walls and ceilings' },
  { id: 'p_spider', power_name: 'Spider-Sense', description: 'Precognitive danger sense' },
  { id: 'p_agil', power_name: 'Enhanced Agility', description: 'Superhuman balance and reflexes' },
  { id: 'p_energy', power_name: 'Energy Blasts', description: 'Project bursts of pure energy' },
  { id: 'p_armor', power_name: 'Powered Armor', description: 'Uses a high-tech exoskeleton suit' },
  { id: 'p_shield', power_name: 'Shield Mastery', description: 'Expert use of a thrown shield' },
  { id: 'p_time', power_name: 'Time Travel', description: 'Move through time' },
  { id: 'p_intang', power_name: 'Intangibility', description: 'Phase through solid objects' },
  { id: 'p_weather', power_name: 'Weather Control', description: 'Manipulate meteorological phenomena' },
  { id: 'p_magic', power_name: 'Magic', description: 'Harness mystical forces' },
  { id: 'p_heal', power_name: 'Healing Factor', description: 'Rapidly regenerate from injuries' },
  { id: 'p_water', power_name: 'Water Telepathy', description: 'Communicate with aquatic life' },
  { id: 'p_swim', power_name: 'Super Swimming', description: 'Swim at incredible speeds' },
  { id: 'p_claws', power_name: 'Adamantium Claws', description: 'Retractable indestructible claws' },
  { id: 'p_senses', power_name: 'Enhanced Senses', description: 'Heightened sight, smell, and hearing' },
  { id: 'p_esp', power_name: 'Espionage', description: 'Master spy and infiltrator' },
  { id: 'p_mark', power_name: 'Marksman', description: 'Perfect aim with ranged weapons' },
  { id: 'p_teleport', power_name: 'Teleportation', description: 'Instantly move between locations' },
  { id: 'p_omega', power_name: 'Omega Beams', description: 'Destructive eye beams that lock onto targets' },
  { id: 'p_telep', power_name: 'Telepathy', description: 'Read and control minds' },
  { id: 'p_magne', power_name: 'Magnetism', description: 'Control over metallic objects' },
  { id: 'p_force', power_name: 'Force Fields', description: 'Generate protective energy barriers' },
  { id: 'p_ring', power_name: 'Power Ring', description: 'Creates energy constructs determined by willpower' },
  { id: 'p_constructs', power_name: 'Energy Constructs', description: 'Form solid light objects' },
  { id: 'p_toxin', power_name: 'Toxins', description: 'Uses chemical poisons and gases' },
  { id: 'p_mad', power_name: 'Madness', description: 'Unpredictable and chaotic mind' },
  { id: 'p_reality', power_name: 'Reality Warping', description: 'Alter the fabric of reality itself' },
  { id: 'p_telek', power_name: 'Telekinesis', description: 'Move objects with the mind' },
  { id: 'p_cyber', power_name: 'Cybernetics', description: 'Machine enhancements integrated into the body' },
  { id: 'p_techno', power_name: 'Technopathy', description: 'Control and interface with technology' },
  { id: 'p_phoenix', power_name: 'Phoenix Force', description: 'Cosmic entity of life and destruction' },
  { id: 'p_lightning', power_name: 'Lightning Control', description: 'Summon and direct electricity' },
  { id: 'p_fourth', power_name: 'Fourth Wall Breaking', description: 'Awareness of being in a fictional universe' },
  { id: 'p_wealth', power_name: 'Wealth', description: 'Immense financial resources' },
  { id: 'p_shape', power_name: 'Shape-Shifting', description: 'Change physical appearance' },
  { id: 'p_symbiote', power_name: 'Symbiote', description: 'Bonded with an alien organism' },
  { id: 'p_venom', power_name: 'Venom Inducement', description: 'Chemically enhanced super strength' },
  { id: 'p_vibra', power_name: 'Vibranium Suit', description: 'Armor made of indestructible metal' },
  { id: 'p_illus', power_name: 'Illusion Manipulation', description: 'Create convincing false images' },
  { id: 'p_radar', power_name: 'Radar Sense', description: '360-degree spatial awareness' },
  { id: 'p_weapon', power_name: 'Weapons Master', description: 'Expert with all forms of weaponry' },
  { id: 'p_hell', power_name: 'Hellfire', description: 'Mystical fire that burns the soul' },
  { id: 'p_penance', power_name: 'Penance Stare', description: 'Inflicts the collected pain of a sinners victims' },
  { id: 'p_cosmic', power_name: 'Power Cosmic', description: 'Limitless cosmic energy' },
  { id: 'p_ftl', power_name: 'FTL Travel', description: 'Move faster than the speed of light' },
  { id: 'p_chloro', power_name: 'Chlorokinesis', description: 'Control over plant life' },
  { id: 'p_immortal', power_name: 'Immortality', description: 'Cannot die by natural means' },
  { id: 'p_size', power_name: 'Size Manipulation', description: 'Grow or shrink in scale' },
  { id: 'p_insect', power_name: 'Insect Communication', description: 'Talk to and control bugs' },
  { id: 'p_density', power_name: 'Density Control', description: 'Alter corporeal mass' },
  { id: 'p_sword', power_name: 'Swordsmanship', description: 'Mastery of bladed combat' },
  { id: 'p_chi', power_name: 'Chi Manipulation', description: 'Harness internal life energy' },
  { id: 'p_vamp', power_name: 'Vampirism', description: 'Undead traits and blood consumption' },
  { id: 'p_moon', power_name: 'Lunar Strength', description: 'Power increases with moonlight' },
  { id: 'p_optic', power_name: 'Optic Blasts', description: 'Concussive energy from the eyes' },
  { id: 'p_leader', power_name: 'Leadership', description: 'Tactical genius and team commander' },
  { id: 'p_absorb', power_name: 'Power Absorption', description: 'Steal powers and memories through touch' },
  { id: 'p_kinetic', power_name: 'Kinetic Manipulation', description: 'Charge objects with explosive energy' },
  { id: 'p_steel', power_name: 'Organic Steel Form', description: 'Transform skin into indestructible metal' },
  { id: 'p_tentacles', power_name: 'Cybernetic Tentacles', description: 'Four robotic arms mentally controlled' },
  { id: 'p_glider', power_name: 'Glider Flight', description: 'Flying vehicle combat' },
  { id: 'p_t_immune', power_name: 'Toxin Immunity', description: 'Immune to all poisons' },
  { id: 'p_pheromone', power_name: 'Pheromone Control', description: 'Control others through chemical scents' },
  { id: 'p_cryo', power_name: 'Cryokinesis', description: 'Control over ice and cold' },
  { id: 'p_elastic', power_name: 'Elasticity', description: 'Stretch and contort the body' },
  { id: 'p_regen', power_name: 'Regeneration', description: 'Rapid healing or regrowth' },
];

const powerMapping: Record<string, string[]> = {
  'h1': ['p_flight', 'p_str', 'p_spd', 'p_heat', 'p_invul', 'p_freeze'],
  'h2': ['p_martial', 'p_gadget', 'p_intel', 'p_stealth'],
  'h3': ['p_str', 'p_flight', 'p_martial', 'p_invul', 'p_weapon'],
  'h4': ['p_str', 'p_web', 'p_wall', 'p_spider', 'p_agil'],
  'h5': ['p_flight', 'p_energy', 'p_intel', 'p_armor'],
  'h6': ['p_str', 'p_martial', 'p_shield', 'p_agil', 'p_leader'],
  'h7': ['p_spd', 'p_time', 'p_intang', 'p_regen'],
  'h8': ['p_flight', 'p_str', 'p_weather', 'p_magic', 'p_invul', 'p_weapon'],
  'h9': ['p_str', 'p_invul', 'p_heal'],
  'h10': ['p_str', 'p_water', 'p_swim', 'p_invul', 'p_weapon'],
  'h11': ['p_heal', 'p_claws', 'p_senses', 'p_martial'],
  'h12': ['p_martial', 'p_gadget', 'p_mark', 'p_esp', 'p_agil'],
  'h13': ['p_magic', 'p_flight', 'p_teleport', 'p_time'],
  'h14': ['p_str', 'p_intel', 'p_invul', 'p_energy', 'p_magic'],
  'h15': ['p_str', 'p_omega', 'p_invul', 'p_telep', 'p_intel'],
  'h16': ['p_magne', 'p_flight', 'p_force', 'p_intel'],
  'h17': ['p_ring', 'p_flight', 'p_constructs', 'p_force'],
  'h18': ['p_intel', 'p_gadget', 'p_toxin', 'p_mad'],
  'h19': ['p_magic', 'p_reality', 'p_telek', 'p_telep', 'p_flight'],
  'h20': ['p_intel', 'p_cyber', 'p_energy', 'p_techno', 'p_flight', 'p_str'],
  'h21': ['p_telep', 'p_telek', 'p_phoenix', 'p_flight'],
  'h22': ['p_flight', 'p_str', 'p_spd', 'p_lightning', 'p_magic'],
  'h23': ['p_heal', 'p_martial', 'p_mark', 'p_fourth', 'p_sword'],
  'h24': ['p_intel', 'p_armor', 'p_wealth', 'p_gadget'],
  'h25': ['p_str', 'p_wall', 'p_web', 'p_shape', 'p_symbiote'],
  'h26': ['p_str', 'p_intel', 'p_venom', 'p_martial'],
  'h27': ['p_martial', 'p_vibra', 'p_intel', 'p_senses', 'p_agil'],
  'h28': ['p_magic', 'p_shape', 'p_illus', 'p_intel'],
  'h29': ['p_mark', 'p_gadget', 'p_martial', 'p_wealth'],
  'h30': ['p_senses', 'p_martial', 'p_radar', 'p_agil'],
  'h31': ['p_mark', 'p_martial', 'p_weapon', 'p_stealth'],
  'h32': ['p_hell', 'p_penance', 'p_invul', 'p_magic'],
  'h33': ['p_cosmic', 'p_flight', 'p_energy', 'p_invul', 'p_ftl'],
  'h34': ['p_martial', 'p_agil', 'p_gadget', 'p_leader'],
  'h35': ['p_martial', 'p_agil', 'p_gadget', 'p_stealth'],
  'h36': ['p_intel', 'p_magic', 'p_armor', 'p_energy', 'p_force'],
  'h37': ['p_shape', 'p_telep', 'p_intang', 'p_flight', 'p_str', 'p_heat'],
  'h38': ['p_chloro', 'p_str', 'p_regen', 'p_shape'],
  'h39': ['p_mark', 'p_gadget', 'p_flight', 'p_leader'],
  'h40': ['p_flight', 'p_str', 'p_spd', 'p_energy', 'p_invul'],
  'h41': ['p_size', 'p_insect', 'p_intel', 'p_agil'],
  'h42': ['p_mark', 'p_martial', 'p_agil'],
  'h43': ['p_intang', 'p_flight', 'p_energy', 'p_density', 'p_intel'],
  'h44': ['p_flight', 'p_energy', 'p_armor', 'p_weapon', 'p_str'],
  'h45': ['p_martial', 'p_str', 'p_agil', 'p_sword', 'p_weapon'],
  'h46': ['p_mark', 'p_intel', 'p_weapon', 'p_gadget'],
  'h47': ['p_martial', 'p_chi', 'p_agil', 'p_weapon'],
  'h48': ['p_vamp', 'p_sword', 'p_heal', 'p_martial', 'p_mark'],
  'h49': ['p_martial', 'p_moon', 'p_gadget', 'p_agil', 'p_mark'],
  'h50': ['p_optic', 'p_leader', 'p_martial'],
  'h51': ['p_weather', 'p_flight', 'p_lightning'],
  'h52': ['p_absorb', 'p_flight', 'p_str', 'p_invul'],
  'h53': ['p_kinetic', 'p_martial', 'p_agil', 'p_mark'],
  'h54': ['p_str', 'p_agil', 'p_intel', 'p_heal'],
  'h55': ['p_steel', 'p_str', 'p_invul'],
  'h56': ['p_teleport', 'p_agil', 'p_wall', 'p_martial'],
  'h57': ['p_shape', 'p_martial', 'p_agil', 'p_stealth', 'p_esp'],
  'h58': ['p_heal', 'p_senses', 'p_claws', 'p_str', 'p_agil'],
  'h59': ['p_intel', 'p_tentacles', 'p_wall', 'p_str'],
  'h60': ['p_intel', 'p_glider', 'p_str', 'p_gadget', 'p_agil'],
  'h61': ['p_str', 'p_intel', 'p_martial', 'p_wealth'],
  'h62': ['p_intel', 'p_cyber', 'p_energy', 'p_invul', 'p_str', 'p_flight'],
  'h63': ['p_flight', 'p_str', 'p_heat', 'p_spd', 'p_invul', 'p_freeze'],
  'h64': ['p_martial', 'p_gadget', 'p_intel', 'p_agil', 'p_stealth'],
  'h65': ['p_mark', 'p_martial', 'p_gadget', 'p_stealth', 'p_weapon'],
  'h66': ['p_agil', 'p_stealth', 'p_martial', 'p_gadget'],
  'h67': ['p_chloro', 'p_t_immune', 'p_pheromone', 'p_intel'],
  'h68': ['p_agil', 'p_martial', 'p_weapon', 'p_mad'],
  'h69': ['p_intel', 'p_mark', 'p_mad'],
  'h70': ['p_intel', 'p_mad', 'p_gadget'],
  'h71': ['p_intel', 'p_gadget', 'p_wealth'],
  'h72': ['p_cryo', 'p_intel', 'p_armor', 'p_weapon', 'p_str'],
  'h73': ['p_flight', 'p_str', 'p_spd', 'p_lightning', 'p_magic', 'p_invul'],
  'h74': ['p_magic', 'p_teleport', 'p_energy'],
  'h75': ['p_magic', 'p_flight', 'p_telek', 'p_telep', 'p_energy', 'p_invul'],
  'h76': ['p_armor', 'p_energy', 'p_flight', 'p_techno', 'p_str'],
  'h77': ['p_elastic', 'p_shape', 'p_invul', 'p_agil'],
  'h78': ['p_chloro', 'p_regen', 'p_str', 'p_immortal']
};

const heroPowers: { hero_id: string, power_id: string }[] = [];
Object.keys(powerMapping).forEach(heroId => {
  powerMapping[heroId].forEach(powerId => {
    heroPowers.push({ hero_id: heroId, power_id: powerId });
  });
});


const matches = [
  { id: 'm1', hero1_id: 'h1', hero2_id: 'h2', winner_id: 'h1', arena_id: 'a1' },
  { id: 'm2', hero1_id: 'h4', hero2_id: 'h5', winner_id: 'h5', arena_id: 'a3' }
];

  db.transaction(() => {
    teams.forEach(t => insertTeam.run(t));
    heroes.forEach(h => insertHero.run(h));
    heroTeams.forEach(ht => insertHeroTeam.run(ht));
    arenas.forEach(a => insertArena.run(a));
    powers.forEach(p => insertPower.run(p));
    heroPowers.forEach(hp => insertHeroPower.run(hp));
    matches.forEach(m => insertMatch.run(m));
  })();
}

// Ensure admin user exists
const adminCheck = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
if (!adminCheck) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (id, username, password, plain_password, role) VALUES (?, ?, ?, ?, ?)").run('u_admin', 'admin', hash, 'admin123', 'admin');
}

const finalCount = db.prepare('SELECT COUNT(*) as c FROM heroes').get() as {c: number};
if (finalCount.c < 100) {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/all.json');
    const apiHeroes = await res.json();
    
    const marvelDc = apiHeroes.filter((h: any) => 
      h.biography.publisher === 'Marvel Comics' || h.biography.publisher === 'DC Comics'
    );
    
    const insertHero = db.prepare(`
      INSERT OR IGNORE INTO heroes (id, name, secret_identity, universe, alignment, description, wins, losses, image_url, hero_type, health, speed, strength)
      VALUES (@id, @name, @secret_identity, @universe, @alignment, @description, @wins, @losses, @image_url, @hero_type, @health, @speed, @strength)
    `);

    db.transaction(() => {
      let added = 0;
      for (const h of marvelDc) {
        if (added >= 200) break;
        
        const universe = h.biography.publisher === 'Marvel Comics' ? 'Marvel' : 'DC';
        const alignment = h.biography.alignment === 'good' ? 'Good' : h.biography.alignment === 'bad' ? 'Evil' : 'Neutral';
        const str = h.powerstats.strength || 50;
        const spd = h.powerstats.speed || 50;
        const int = h.powerstats.intelligence || 50;
        
        let type = 'strength';
        if (spd > str && spd > int) type = 'speed';
        else if (int > str && int > spd) type = 'flight';

        insertHero.run({
          id: 'api_' + h.id,
          name: h.name,
          secret_identity: h.biography.fullName || '',
          universe,
          alignment,
          description: (h.connections?.groupAffiliation || 'An extraordinary individual.') + ' ' + (h.work?.base || ''),
          wins: Math.floor(Math.random() * 150),
          losses: Math.floor(Math.random() * 50),
          image_url: h.images.md,
          hero_type: type,
          health: h.powerstats.combat || 50,
          speed: spd,
          strength: str
        });
        added++;
      }
    })();
    console.log('Seeded additional Marvel/DC heroes from API');
  } catch (e) {
    console.error("Failed to seed additional heroes", e);
  }
}

export default db;
