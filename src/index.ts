import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(express.json());

// Configurer PostgreSQL avec les variables d'environnement
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
});

// Tester la connexion à la base
pool.connect()
  .then(() => console.log('✅ Connecté à PostgreSQL'))
  .catch((err) => console.error('❌ Erreur de connexion à PostgreSQL :', err));

// Routes
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur interne');
  }
});

app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks(title) VALUES($1) RETURNING *',
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur interne');
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur interne');
  }
});

// Lancer le serveu
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Serveur lancé sur le port ${port}`);
  console.log('Connexion à PostgreSQL avec :', {
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD?.slice(0, 4) + '***',
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
  });
  
});
