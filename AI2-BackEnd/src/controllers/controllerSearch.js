const db = require('../models');
const { Op } = require('sequelize');

const Utilizador = db.utilizadores;
const Formador = db.formador;
const Formando = db.formando;
const Curso = db.curso;

exports.searchTudo = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = parseInt(req.query.limit) || 10;
    const palavras = q.split(/\s+/).filter(Boolean);

    if (!q) return res.json([]);

    const [utilizadores, cursos] = await Promise.all([
      db.utilizadores.findAll({
        where: {
          utilizador_ativo: true,
          [Op.and]: palavras.map(palavra => ({
            nome: { [Op.iLike]: `%${palavra}%` }
          }))
        },
        attributes: ['id_utilizador', 'nome', 'email'],
        include: [
          {
            model: db.formador,
            as: 'formador',
            attributes: ['id_formador', 'formador_ativo'],
            required: false
          },
          {
            model: db.formando,
            as: 'formando',
            attributes: ['id_formando', 'formando_ativo'],
            required: false
          }
        ],
        limit
      }),
      db.curso.findAll({
        where: {
          curso_ativo: true,
          titulo: { [Op.iLike]: `%${q}%` }
        },
        attributes: ['id_curso', 'titulo'],
        limit
      })
    ]);

    const resultados = [];

    for (const u of utilizadores) {
      if (u.formador && (u.formador.formador_ativo ?? true)) {
        resultados.push({
          id: `${u.formador.id_formador}`,
          id_utilizador: u.id_utilizador,
          nome: u.nome,
          tipo: 'formador'
        });
      }

      if (u.formando && (u.formando.formando_ativo ?? true)) {
        resultados.push({
          id: `${u.formando.id_formando}`,
          id_utilizador: u.id_utilizador,
          nome: u.nome,
          tipo: 'formando'
        });
      }
    }

    resultados.push(...cursos.map(c => ({
      id: `${c.id_curso}`,
      id_curso: c.id_curso,
      nome: c.titulo,
      tipo: 'curso'
    })));

    return res.json(resultados);

  } catch (err) {
    console.error('Erro na pesquisa combinada:', err);
    res.status(500).json({
      mensagem: 'Erro na pesquisa combinada',
      erro: err.message
    });
  }
};