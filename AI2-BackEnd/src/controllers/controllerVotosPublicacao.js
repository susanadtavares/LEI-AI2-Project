const db = require('../models');
const Voto = db.votos_publicacao;
const Publicacao = db.publicacao;
const Utilizadores = db.utilizadores;

exports.votar = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const id_publicacao = Number(req.params.id);
    const { id_utilizador, direcao } = req.body; 

    if (!['up', 'down'].includes(direcao)) {
      await t.rollback();
      return res.status(400).json({ erro: "direcao inválida. Use 'up' ou 'down'." });
    }

    const pub = await Publicacao.findOne({ where: { id_publicacao, publicacao_ativa: true }, transaction: t });
    if (!pub) { await t.rollback(); return res.status(404).json({ erro: 'Publicação não encontrada ou inativa.' }); }

    const user = await Utilizadores.findOne({ where: { id_utilizador, utilizador_ativo: true }, transaction: t });
    if (!user) { await t.rollback(); return res.status(403).json({ erro: 'Utilizador inativo ou inexistente.' }); }

    const mapped = direcao === 'up' ? 1 : -1;

    let existente = await Voto.findOne({ where: { id_publicacao, id_utilizador }, transaction: t });

    let user_vote = null;
    if (!existente) {
      await Voto.create({ id_publicacao, id_utilizador, valor: mapped }, { transaction: t });
      user_vote = direcao;
    } else if (existente.valor === mapped) {
      await existente.destroy({ transaction: t }); 
      user_vote = null;
    } else {
      existente.valor = mapped;                    
      await existente.save({ transaction: t });
      user_vote = direcao;
    }

    // Calculate upvotes and downvotes
    const [result] = await Voto.findAll({
      where: { id_publicacao },
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN valor = 1 THEN 1 ELSE 0 END')), 'upvotes'],
        [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN valor = -1 THEN 1 ELSE 0 END')), 'downvotes']
      ],
      raw: true,
      transaction: t
    });

    const upvotes = Number(result.upvotes) || 0;
    const downvotes = Number(result.downvotes) || 0;

    await t.commit();
    return res.json({ sucesso: true, upvotes, downvotes, user_vote });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao votar', detalhes: err.message });
  }
};

exports.getVoteStatus = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const id_publicacao = Number(req.params.id);
    const id_utilizador = req.user.id_utilizador || req.user.userId || req.user.id; // Fallback for different field names
    console.log('getVoteStatus:', { id_publicacao, id_utilizador }); // Debug
    if (!id_publicacao || !id_utilizador) {
      await t.rollback();
      return res.status(400).json({ erro: 'id_publicacao e id_utilizador são obrigatórios.' });
    }

    const pub = await Publicacao.findOne({ where: { id_publicacao, publicacao_ativa: true }, transaction: t });
    if (!pub) { await t.rollback(); return res.status(404).json({ erro: 'Publicação não encontrada ou inativa.' }); }

    const user = await Utilizadores.findOne({ where: { id_utilizador, utilizador_ativo: true }, transaction: t });
    if (!user) { await t.rollback(); return res.status(403).json({ erro: 'Utilizador inativo ou inexistente.' }); }

    const [result] = await Voto.findAll({
      where: { id_publicacao },
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN valor = 1 THEN 1 ELSE 0 END')), 'upvotes'],
        [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN valor = -1 THEN 1 ELSE 0 END')), 'downvotes']
      ],
      raw: true,
      transaction: t
    });

    const upvotes = Number(result.upvotes) || 0;
    const downvotes = Number(result.downvotes) || 0;

    const existente = await Voto.findOne({ where: { id_publicacao, id_utilizador }, transaction: t });
    const user_vote = existente ? (existente.valor === 1 ? 'up' : 'down') : null;

    await t.commit();
    return res.json({ sucesso: true, upvotes, downvotes, user_vote });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao obter status do voto', detalhes: err.message });
  }
};