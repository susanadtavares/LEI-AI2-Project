const express = require('express');
const router = express.Router();
const db = require('../models');
const {validation} = require('../middleware/jwtMiddleware');

router.get('/stats', validation, async (req, res) => {
  try {
    const totalUsers = await db.utilizadores.count();
    const totalFormadores = await db.formador.count();
    const totalCursos = await db.curso.count();
    const totalFormandos = await db.formando.count();

    // Calcular duração total em dias
    const cursos = await db.curso.findAll({
      attributes: ['data_inicio', 'data_fim']
    });

    let totalDias = 0;
    cursos.forEach(curso => {
      const inicio = new Date(curso.data_inicio);
      const fim = new Date(curso.data_fim);
      const dias = Math.max((fim - inicio) / (1000 * 60 * 60 * 24), 0);
      totalDias += dias;
    });

    /*// Top 5 cursos com maior avaliação
    const topCourses = await db.curso.findAll({
      attributes: ['id_curso', 'titulo', 'descricao', 'avaliacao'],
      where: {
        avaliacao: { [db.Sequelize.Op.not]: null }
      },
      order: [['avaliacao', 'DESC']],
      limit: 5
    });*/

    const latestCourses = await db.curso.findAll({
      attributes: ['id_curso', 'titulo', 'descricao', 'tumbnail'],
      order: [['id_curso', 'DESC']],
      limit: 5
    });

    res.json({
      totalUsers,
      totalFormadores,
      totalFormandos,
      totalCursos,
      totalDias: Math.round(totalDias),
      latestCourses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao obter estatísticas', detalhes: err.message });
  }
});

module.exports = router;
