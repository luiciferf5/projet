import express from 'express';
import pkg from 'pg';  // Importation par défaut de `pg`
import dotenv from 'dotenv';

const { Pool } = pkg;  

// Charger les variables d'environnement
dotenv.config();

const app = express();
app.use(express.json());

// Configuration de la base de données PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER, // Utilisation de POSTGRES_USER
    password: process.env.POSTGRES_PASSWORD, // Utilisation de POSTGRES_PASSWORD
    host: 'yamabiko.proxy.rlwy.net', // L'hôte de la base de données PostgreSQL
    port: 37383, // Port de la base de données PostgreSQL
    database: 'railway', // Nom de la base de données
  });

// Route pour récupérer toutes les tâches
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Route pour ajouter une nouvelle tâche
app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query('INSERT INTO tasks(title) VALUES($1) RETURNING *', [title]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Route pour supprimer une tâche
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Configuration du port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
