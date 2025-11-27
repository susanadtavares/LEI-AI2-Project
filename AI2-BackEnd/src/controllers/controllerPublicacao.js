const db = require('../models');
const { Sequelize } = require('sequelize');
const { uploadBuffer } = require('./controllerUpload');
const Publicacao = db.publicacao;
const TopicoForum = db.topico_forum;
const AnexoPublicacao = db.anexo_publicacao;
const Utilizadores = db.utilizadores;

exports.createPublicacao = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      id_topico_forum,
      id_utilizador,
      titulo_publicacao,
      descricao_publicacao,
      data_publicacao
    } = req.body;

    if (!id_topico_forum || !id_utilizador || !titulo_publicacao || !descricao_publicacao) {
      await t.rollback();
      return res.status(400).json({
        erro: 'Campos obrigatórios em falta: id_topico_forum, id_utilizador, titulo_publicacao, descricao_publicacao'
      });
    }

    const topico = await TopicoForum.findOne({ where: { id_topico_forum, ativo: true }, transaction: t });
    if (!topico) {
      await t.rollback();
      return res.status(404).json({ erro: 'O tópico indicado não existe ou está inativo.' });
    }

    const autor = await Utilizadores.findOne({
      where: { id_utilizador, utilizador_ativo: true },
      transaction: t
    });
    if (!autor) {
      await t.rollback();
      return res.status(403).json({ erro: 'Utilizador inativo ou inexistente.' });
    }

    const nova = await Publicacao.create({
      id_topico_forum,
      id_utilizador,
      titulo_publicacao,
      descricao_publicacao,
      data_publicacao: data_publicacao || Sequelize.fn('NOW'),
      publicacao_ativa: true
    }, { transaction: t });

    const imagens = req.files?.imagens ?? [];
    const videos = req.files?.videos ?? [];
    const ficheiros = req.files?.ficheiros ?? [];

    const anexosParaCriar = [];

    for (const f of imagens) {
      const url = await uploadBuffer(f.buffer, `uploads-projeto/publicacoes/${nova.id_publicacao}/imagens`, 'image');
      anexosParaCriar.push({ id_publicacao: nova.id_publicacao, nome_original: f.originalname, filename: url, mimetype: f.mimetype, tamanho: f.size });
    }
    for (const f of videos) {
      const url = await uploadBuffer(f.buffer, `uploads-projeto/publicacoes/${nova.id_publicacao}/videos`, 'video');
      anexosParaCriar.push({ id_publicacao: nova.id_publicacao, nome_original: f.originalname, filename: url, mimetype: f.mimetype, tamanho: f.size });
    }
    for (const f of ficheiros) {
      const url = await uploadBuffer(f.buffer, `uploads-projeto/publicacoes/${nova.id_publicacao}/ficheiros`, f.mimetype === 'application/pdf' ? 'raw' : 'auto');
      anexosParaCriar.push({ id_publicacao: nova.id_publicacao, nome_original: f.originalname, filename: url, mimetype: f.mimetype, tamanho: f.size });
    }

    if (anexosParaCriar.length) {
      await AnexoPublicacao.bulkCreate(anexosParaCriar, { transaction: t });
    }

    await t.commit();
    return res.status(201).json(nova);
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao criar publicação', detalhes: err.message });
  }
};

exports.getPublicacoes = async (req, res) => {
  const { id_topico_forum } = req.params;

  if (!id_topico_forum) {
    return res.status(400).json({ mensagem: 'id_topico_forum é obrigatório' });
  }

  try {
    const publicacoes = await Publicacao.findAll({
      where: {
        id_topico_forum,
        publicacao_ativa: true
      },
      include: [
        {
          model: db.utilizadores,
          as: 'autor',
          attributes: ['id_utilizador', 'nome', 'email', 'utilizador_ativo'],
          where: { utilizador_ativo: true },
          required: true
        },
        {
          model: db.anexo_publicacao,
          as: 'anexos',
          attributes: [
            'idanexo_publicacao',
            'nome_original',
            'filename',
            'mimetype',
            'tamanho',
            'anexo_publicacao_ativo'
          ],
          where: { anexo_publicacao_ativo: true },
          required: false
        },
        {
          model: db.topico_forum,
          as: 'topico_forum',
          attributes: ['id_topico_forum', 'titulo_topico', 'ativo']
        }
      ],
      order: [['data_publicacao', 'DESC']]
    });

    return res.json(publicacoes);
  } catch (err) {
    console.error('Erro ao buscar publicações:', err);
    return res.status(500).json({ mensagem: 'Erro ao buscar publicações', erro: err.message });
  }
};

exports.getPublicacaoById = async (req, res) => {
  try {
    const publicacao = await Publicacao.findByPk(req.params.id, {
      include: [
        { model: db.topico_forum, as: 'topico_forum', attributes: ['id_topico_forum', 'titulo_topico', 'ativo'] },
        { model: db.utilizadores, as: 'autor', attributes: ['id_utilizador', 'nome', 'email', 'utilizador_ativo'] },
        {
          model: db.anexo_publicacao,
          as: 'anexos',
          attributes: ['idanexo_publicacao', 'nome_original', 'filename', 'mimetype', 'tamanho', 'anexo_publicacao_ativo'],
          where: { anexo_publicacao_ativo: true },
          required: false
        }
      ]
    });

    if (!publicacao) {
      return res.status(404).json({ mensagem: 'Publicação não encontrada' });
    }

    if (publicacao.topico_forum && !publicacao.topico_forum.ativo) {
      return res.status(403).json({ mensagem: 'O tópico desta publicação está inativo.' });
    }
    if (publicacao.autor && !publicacao.autor.utilizador_ativo) {
      return res.status(403).json({ mensagem: 'O autor desta publicação está inativo.' });
    }

    return res.json(publicacao);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensagem: 'Erro ao buscar publicação', erro: err.message });
  }
};

exports.deletePublicacao = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const user = req.user;

    // Verificar tanto tipo quanto role, ignorando case sensitivity para 'gestor' ou 'Gestor'
    const isGestor = user && (user.tipo === 'gestor' || user.tipo === 'Gestor' || user.role === 'gestor' || user.role === 'Gestor');
    if (!isGestor) {
      await t.rollback();
      return res.status(403).json({ mensagem: 'Apenas Gestores podem eliminar posts.' });
    }

    const publicacao = await Publicacao.findOne({
      where: { id_publicacao: id, publicacao_ativa: true },
      transaction: t
    });

    if (!publicacao) {
      await t.rollback();
      return res.status(404).json({ mensagem: 'Publicação não encontrada ou já inativa' });
    }

    publicacao.publicacao_ativa = false;
    await publicacao.save({ transaction: t });

    await AnexoPublicacao.update(
      { anexo_publicacao_ativo: false },
      { where: { id_publicacao: id, anexo_publicacao_ativo: true }, transaction: t }
    );

    await t.commit();
    return res.status(200).json({ sucesso: true, mensagem: 'Publicação e anexos desativados com sucesso.' });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ mensagem: 'Erro ao desativar publicação', erro: err.message });
  }
};

exports.getPostsByTopicoId = async (req, res) => {
  try {
    const { id_topico_forum } = req.params;
    const publicacoes = await Publicacao.findAll({
      where: { id_topico_forum, publicacao_ativa: true },
      include: [
        {
          model: db.utilizadores,
          as: 'autor',
          attributes: ['id_utilizador', 'nome'],
          where: { utilizador_ativo: true },
          required: true
        },
        {
          model: db.anexo_publicacao,
          as: 'anexos',
          where: { anexo_publicacao_ativo: true },
          required: false
        }
      ],
      attributes: {
        include: [
          [Sequelize.literal('(SELECT COALESCE(SUM(CASE WHEN valor = 1 THEN 1 ELSE 0 END), 0) FROM votos_publicacao WHERE votos_publicacao.id_publicacao = publicacao.id_publicacao)'), 'upvote_count'],
          [Sequelize.literal('(SELECT COALESCE(SUM(CASE WHEN valor = -1 THEN 1 ELSE 0 END), 0) FROM votos_publicacao WHERE votos_publicacao.id_publicacao = publicacao.id_publicacao)'), 'downvote_count']
        ]
      },
      order: [
        [Sequelize.literal('(SELECT COALESCE(SUM(CASE WHEN valor = 1 THEN 1 ELSE 0 END), 0) FROM votos_publicacao WHERE votos_publicacao.id_publicacao = publicacao.id_publicacao) - (SELECT COALESCE(SUM(CASE WHEN valor = -1 THEN 1 ELSE 0 END), 0) FROM votos_publicacao WHERE votos_publicacao.id_publicacao = publicacao.id_publicacao)'), 'DESC'],
        [Sequelize.literal('CASE WHEN (SELECT COALESCE(SUM(CASE WHEN valor = 1 THEN 1 ELSE 0 END), 0) FROM votos_publicacao WHERE votos_publicacao.id_publicacao = publicacao.id_publicacao) = (SELECT COALESCE(SUM(CASE WHEN valor = -1 THEN 1 ELSE 0 END), 0) FROM votos_publicacao WHERE votos_publicacao.id_publicacao = publicacao.id_publicacao) THEN data_publicacao ELSE NULL END'), 'DESC NULLS LAST'],
        [Sequelize.literal('(SELECT COALESCE(SUM(CASE WHEN valor = -1 THEN 1 ELSE 0 END), 0) FROM votos_publicacao WHERE votos_publicacao.id_publicacao = publicacao.id_publicacao)'), 'ASC']
      ]
    });
    return res.status(200).json({ sucesso: true, data: publicacoes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensagem: 'Erro ao buscar posts', erro: err.message });
  }
};