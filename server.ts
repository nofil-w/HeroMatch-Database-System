import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import db from './server/db.ts'; 
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-hero-match';

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    (req as any).user = user;
    next();
  });
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ error: 'Requires admin privileges' });
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- API Routes ---
  app.get('/api/heroes', (req, res) => {
    const term = req.query.q ? `%${req.query.q}%` : '%';
    const teamId = req.query.team;
    const universe = req.query.universe;
    
    let query = `
      SELECT 
        h.*, 
        (SELECT group_concat(t.name) FROM hero_teams ht JOIN teams t ON ht.team_id = t.id WHERE ht.hero_id = h.id) as teams,
        (SELECT group_concat(p.power_name) FROM hero_powers hp JOIN powers p ON hp.power_id = p.id WHERE hp.hero_id = h.id) as powers
      FROM heroes h
      WHERE (h.name LIKE @term OR h.universe LIKE @term OR h.hero_type LIKE @term OR h.description LIKE @term)
    `;
    
    if (term === '%') {
      // If no query, we just take everything
    } else {
       // Term is applied
    }

    const params: any = { term };

    if (teamId && teamId !== 'all') {
      query += ` AND h.id IN (SELECT hero_id FROM hero_teams WHERE team_id = @teamId)`;
      params.teamId = teamId;
    }

    if (universe && universe !== 'all') {
      query += ` AND h.universe = @universe`;
      params.universe = universe;
    }

    const stmt = db.prepare(query);
    const heroes = stmt.all(params);
    const parsed = heroes.map((h: any) => ({ 
      ...h, 
      teams: h.teams ? h.teams.split(',') : [],
      powers: h.powers ? h.powers.split(',') : []
    }));
    return res.json(parsed);
  });

  app.get('/api/universes', (req, res) => {
    try {
      const universes = db.prepare(`
        SELECT name, color FROM (
          SELECT DISTINCT h.universe as name, 
            COALESCE(
              u.color, 
              CASE 
                WHEN h.universe = 'Marvel' THEN '#ef4444' 
                WHEN h.universe = 'DC' THEN '#3b82f6' 
                ELSE '#3b82f6' 
              END
            ) as color
          FROM heroes h
          LEFT JOIN universes u ON h.universe = u.name
          WHERE h.universe IS NOT NULL AND h.universe != ''
          UNION
          SELECT name, color FROM universes
        ) ORDER BY name ASC
      `).all();
      res.json(universes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/roles', (req, res) => {
    const roles = db.prepare(`
      SELECT DISTINCT name FROM (
        SELECT hero_type as name FROM heroes WHERE hero_type IS NOT NULL AND hero_type != ''
        UNION
        SELECT name FROM roles
      ) ORDER BY name
    `).all();
    res.json(roles.map((r: any) => r.name));
  });

  app.get('/api/powers', (req, res) => {
    const powers = db.prepare('SELECT power_name FROM powers ORDER BY power_name').all();
    res.json(powers.map((p: any) => p.power_name));
  });

  app.post('/api/tags', authenticateToken, requireAdmin, (req, res) => {
    const { name, type, color } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type required' });
    try {
      if (type === 'universe') {
        db.prepare('INSERT OR REPLACE INTO universes (name, color) VALUES (?, ?)').run(name, color || '#3b82f6');
      } else if (type === 'role') {
        db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)').run(name);
      } else if (type === 'power') {
        db.prepare('INSERT OR IGNORE INTO powers (id, power_name) VALUES (?, ?)').run('p_' + Date.now(), name);
      } else {
        return res.status(400).json({ error: 'Invalid tag type' });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/teams', (req, res) => {
    const teams = db.prepare('SELECT * FROM teams').all();
    res.json(teams);
  });

  app.get('/api/arenas', (req, res) => {
    const arenas = db.prepare('SELECT * FROM arenas').all();
    res.json(arenas);
  });

  app.get('/api/heroes/:id', (req, res) => {
    const stmt = db.prepare(`
      SELECT 
        h.*, 
        (SELECT group_concat(t.name) FROM hero_teams ht JOIN teams t ON ht.team_id = t.id WHERE ht.hero_id = h.id) as teams,
        (SELECT group_concat(p.power_name) FROM hero_powers hp JOIN powers p ON hp.power_id = p.id WHERE hp.hero_id = h.id) as powers
      FROM heroes h
      WHERE h.id = ?
    `);
    const hero: any = stmt.get(req.params.id);
    if (!hero) return res.status(404).json({ error: 'Not found' });
    
    hero.teams = hero.teams ? hero.teams.split(',') : [];
    hero.powers = hero.powers ? hero.powers.split(',') : [];
    res.json(hero);
  });

  app.get('/api/matches', (req, res) => {
    const matches = db.prepare(`
      SELECT 
        m.id, 
        h1.name as hero1_name, 
        h2.name as hero2_name, 
        w.name as winner_name, 
        a.name as arena_name, 
        m.match_date 
      FROM matches m
      JOIN heroes h1 ON m.hero1_id = h1.id
      JOIN heroes h2 ON m.hero2_id = h2.id
      JOIN heroes w ON m.winner_id = w.id
      JOIN arenas a ON m.arena_id = a.id
      ORDER BY m.match_date DESC
    `).all();
    res.json(matches);
  });

  app.post('/api/matches', (req, res) => {
    const { hero1_id, hero2_id, winner_id, arena_id } = req.body;
    if (!hero1_id || !hero2_id || !winner_id || !arena_id) {
       return res.status(400).json({ error: 'Missing required match fields' });
    }
    const id = 'm_usr_' + Date.now();
    try {
      db.prepare('INSERT INTO matches (id, hero1_id, hero2_id, winner_id, arena_id) VALUES (?, ?, ?, ?, ?)').run(id, hero1_id, hero2_id, winner_id, arena_id);
      res.json({ success: true, id });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/leaderboard', (req, res) => {
    const leaderboard = db.prepare('SELECT * FROM Leaderboard').all();
    res.json(leaderboard);
  });

  // --- Auth Routes ---
  app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    try {
      const hash = bcrypt.hashSync(password, 10);
      const id = 'u_' + Date.now();
      db.prepare('INSERT INTO users (id, username, password, plain_password) VALUES (?, ?, ?, ?)').run(id, username, hash, password);
      const token = jwt.sign({ id, username, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id, username, role: 'user' } });
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  app.get('/api/me', authenticateToken, (req, res) => {
    res.json({ user: (req as any).user });
  });

  // --- Hero CRUD Routes ---
  app.post('/api/heroes', authenticateToken, requireAdmin, (req, res) => {
    const { name, secret_identity, universe, alignment, description, image_url, hero_type, health, speed, strength, powers } = req.body;
    if (!name || !universe || !hero_type) return res.status(400).json({ error: 'Missing required fields' });
    const id = 'h_usr_' + Date.now();
    try {
      db.transaction(() => {
        db.prepare(`
          INSERT INTO heroes (id, name, secret_identity, universe, alignment, description, image_url, hero_type, health, speed, strength)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, secret_identity, universe, alignment, description, image_url, hero_type, health || 50, speed || 50, strength || 50);
        
        if (Array.isArray(powers)) {
          for (const p of powers) {
            let powerRecord: any = db.prepare('SELECT id FROM powers WHERE power_name = ?').get(p);
            if (!powerRecord) {
              const pid = 'p_' + Date.now() + Math.floor(Math.random()*1000);
              db.prepare('INSERT INTO powers (id, power_name) VALUES (?, ?)').run(pid, p);
              powerRecord = { id: pid };
            }
            db.prepare('INSERT INTO hero_powers (hero_id, power_id) VALUES (?, ?)').run(id, powerRecord.id);
          }
        }
      })();
      res.json({ success: true, id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/heroes/:id', authenticateToken, requireAdmin, (req, res) => {
    const { name, secret_identity, universe, alignment, description, image_url, hero_type, health, speed, strength, powers } = req.body;
    try {
      db.transaction(() => {
        db.prepare(`
          UPDATE heroes SET 
            name = ?, secret_identity = ?, universe = ?, alignment = ?, description = ?, 
            image_url = ?, hero_type = ?, health = ?, speed = ?, strength = ?
          WHERE id = ?
        `).run(name, secret_identity, universe, alignment, description, image_url, hero_type, health, speed, strength, req.params.id);
        
        if (Array.isArray(powers)) {
          db.prepare('DELETE FROM hero_powers WHERE hero_id = ?').run(req.params.id);
          for (const p of powers) {
            let powerRecord: any = db.prepare('SELECT id FROM powers WHERE power_name = ?').get(p);
            if (!powerRecord) {
              const pid = 'p_' + Date.now() + Math.floor(Math.random()*1000);
              db.prepare('INSERT INTO powers (id, power_name) VALUES (?, ?)').run(pid, p);
              powerRecord = { id: pid };
            }
            db.prepare('INSERT INTO hero_powers (hero_id, power_id) VALUES (?, ?)').run(req.params.id, powerRecord.id);
          }
        }
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/heroes/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
      db.prepare('DELETE FROM heroes WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Tag Management Routes ---
  app.put('/api/tags', authenticateToken, requireAdmin, (req, res) => {
    const { type, oldName, newName, color } = req.body;
    try {
      db.transaction(() => {
        if (type === 'universes') {
          db.prepare('UPDATE universes SET name = ?, color = ? WHERE name = ?').run(newName, color || '#3b82f6', oldName);
          db.prepare('UPDATE heroes SET universe = ? WHERE universe = ?').run(newName, oldName);
        } else if (type === 'roles') {
          db.prepare('UPDATE roles SET name = ? WHERE name = ?').run(newName, oldName);
          db.prepare('UPDATE heroes SET hero_type = ? WHERE hero_type = ?').run(newName, oldName);
        } else if (type === 'teams') {
          db.prepare('UPDATE teams SET name = ? WHERE name = ?').run(newName, oldName);
        } else if (type === 'powers') {
          db.prepare('UPDATE powers SET power_name = ? WHERE power_name = ?').run(newName, oldName);
        }
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/tags', authenticateToken, requireAdmin, (req, res) => {
    const { type, name } = req.body;
    try {
      db.transaction(() => {
        if (type === 'universes') {
          db.prepare('DELETE FROM universes WHERE name = ?').run(name);
          db.prepare('UPDATE heroes SET universe = NULL WHERE universe = ?').run(name);
        } else if (type === 'roles') {
          db.prepare('DELETE FROM roles WHERE name = ?').run(name);
          db.prepare('UPDATE heroes SET hero_type = NULL WHERE hero_type = ?').run(name);
        } else if (type === 'teams') {
          db.prepare('DELETE FROM teams WHERE name = ?').run(name);
        } else if (type === 'powers') {
          db.prepare('DELETE FROM powers WHERE power_name = ?').run(name);
        }
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Users Management Routes ---
  app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
    try {
      const users = db.prepare('SELECT id, username, role FROM users').all();
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/users/reveal', authenticateToken, requireAdmin, (req, res) => {
    const { targetUserId, adminPassword } = req.body;
    try {
      const admin: any = db.prepare('SELECT password FROM users WHERE id = ?').get((req as any).user.id);
      if (!bcrypt.compareSync(adminPassword, admin.password)) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
      const targetUser: any = db.prepare('SELECT plain_password FROM users WHERE id = ?').get(targetUserId);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      res.json({ password: targetUser.plain_password });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/users/admin', authenticateToken, requireAdmin, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    try {
      const hash = bcrypt.hashSync(password, 10);
      const id = 'u_admin_' + Date.now();
      db.prepare('INSERT INTO users (id, username, password, plain_password, role) VALUES (?, ?, ?, ?, ?)').run(id, username, hash, password, 'admin');
      res.json({ success: true });
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: e.message });
    }
  });

  // --- Vite Middleware/Static ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
