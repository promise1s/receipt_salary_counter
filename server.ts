import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('local_data.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS profile_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS wishes_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/profile', (req, res) => {
    try {
      const stmt = db.prepare('INSERT INTO profile_history (data) VALUES (?)');
      const info = stmt.run(JSON.stringify(req.body));
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
      console.error('Error saving profile:', error);
      res.status(500).json({ error: 'Failed to save profile' });
    }
  });

  app.get('/api/profile/latest', (req, res) => {
    try {
      const stmt = db.prepare('SELECT data FROM profile_history ORDER BY created_at DESC LIMIT 1');
      const row = stmt.get() as { data: string } | undefined;
      if (row) {
        res.json(JSON.parse(row.data));
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      res.status(500).json({ error: 'Failed to load profile' });
    }
  });

  app.post('/api/wishes', (req, res) => {
    try {
      const stmt = db.prepare('INSERT INTO wishes_history (data) VALUES (?)');
      const info = stmt.run(JSON.stringify(req.body));
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
      console.error('Error saving wishes:', error);
      res.status(500).json({ error: 'Failed to save wishes' });
    }
  });

  app.get('/api/wishes/latest', (req, res) => {
    try {
      const stmt = db.prepare('SELECT data FROM wishes_history ORDER BY created_at DESC LIMIT 1');
      const row = stmt.get() as { data: string } | undefined;
      if (row) {
        res.json(JSON.parse(row.data));
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Error loading wishes:', error);
      res.status(500).json({ error: 'Failed to load wishes' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving (if needed)
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
