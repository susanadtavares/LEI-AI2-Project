/*const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ LIGAÇÃO À BASE DE DADOS
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'softinsa',    // substitui pelo nome da tua base de dados
  password: 'qwerty',   // substitui pela tua senha do PostgreSQL
  port: 5432,                   // porta padrão do PostgreSQL
});

// TESTE DE LIGAÇÃO (opcional)
pool.connect((err, client) => {
  if (err) {
    console.error('Erro ao ligar à base de dados:', err);
  } else {
    console.log('Ligado à base de dados PostgreSQL');
  }
});

// ROTA DE LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM utilizadores WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ email: user.email, role: user.role });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('Erro na consulta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// INICIAR SERVIDOR
app.listen(3001, () => {
  console.log('Servidor backend ativo em http://localhost:3001');
});*/


// index.js
require('./src/app');
