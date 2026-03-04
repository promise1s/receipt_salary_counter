const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

function startServer() {
  const serverApp = express();
  const PORT = 3000;

  // Database setup
  // In Electron, use userData directory for persistent storage
  const dbPath = path.join(app.getPath('userData'), 'salary_receipt.db');
  console.log('Database path:', dbPath);
  
  const db = new Database(dbPath);

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

  serverApp.use(express.json());

  // API Routes
  serverApp.post('/api/profile', (req, res) => {
    try {
      const stmt = db.prepare('INSERT INTO profile_history (data) VALUES (?)');
      const info = stmt.run(JSON.stringify(req.body));
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
      console.error('Error saving profile:', error);
      res.status(500).json({ error: 'Failed to save profile' });
    }
  });

  serverApp.get('/api/profile/latest', (req, res) => {
    try {
      const stmt = db.prepare('SELECT data FROM profile_history ORDER BY created_at DESC LIMIT 1');
      const row = stmt.get();
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

  serverApp.post('/api/wishes', (req, res) => {
    try {
      const stmt = db.prepare('INSERT INTO wishes_history (data) VALUES (?)');
      const info = stmt.run(JSON.stringify(req.body));
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
      console.error('Error saving wishes:', error);
      res.status(500).json({ error: 'Failed to save wishes' });
    }
  });

  serverApp.get('/api/wishes/latest', (req, res) => {
    try {
      const stmt = db.prepare('SELECT data FROM wishes_history ORDER BY created_at DESC LIMIT 1');
      const row = stmt.get();
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

  // Serve static files from 'dist' directory
  // In production (packaged app), __dirname is inside app.asar
  // We need to point to the dist folder which is also packed
  const distPath = path.join(__dirname, 'dist');
  serverApp.use(express.static(distPath));

  // Fallback for SPA
  serverApp.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    const server = serverApp.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = address.port;
      console.log(`Electron internal server running on http://127.0.0.1:${port}`);
      resolve({ server, port });
    });
    server.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = { startServer };
