const { Sequelize } = require('sequelize');
const db = require('../models');
const TopicoForum = db.topico_forum;
const Area = db.area;
const Publicacao = db.publicacao;

const onlyLettersRegex = /^[A-Za-zÀ-ÿ0-9\s.,!?()-]+$/;

exports.createTopicoForum = async (req, res) => {
  try {
    const { id_area, titulo_topico, descricao_topico } = req.body;

    if (!titulo_topico || !id_area) {
      return res.status(400).json({ sucesso: false, mensagem: 'O título e a área são obrigatórios.' });
    }

    if (!onlyLettersRegex.test(titulo_topico)) {
      return res.status(400).json({ sucesso: false, mensagem: 'O título contém caracteres inválidos.' });
    }

    const area = await Area.findOne({ where: { id_area, area_ativa: true } });
    if (!area) {
      return res.status(404).json({ sucesso: false, mensagem: 'Área associada não encontrada ou inativa.' });
    }

    const novoTopico = await TopicoForum.create({
      id_area,
      titulo_topico,
      descricao_topico,
      ativo: true
    });

    res.status(201).json({ sucesso: true, mensagem: 'Tópico do fórum criado com sucesso!', data: novoTopico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar tópico do fórum', erro: err.message });
  }
};

exports.getTopicosForumByArea = async (req, res) => {
  try {
    const { id } = req.params; 

    const area = await Area.findOne({ where: { id_area: id, area_ativa: true } });
    if (!area) {
      return res.status(404).json({ sucesso: false, mensagem: 'Área não encontrada ou inativa.' });
    }

    const topicos = await TopicoForum.findAll({
      where: { id_area: id, ativo: true },
      attributes: {
        include: [
          [Sequelize.literal(`(
            SELECT COUNT(*)
            FROM publicacao AS p
            WHERE p.id_topico_forum = topico_forum.id_topico_forum
              AND p.publicacao_ativa = true
          )`), 'total_posts']
        ]
      },
      order: [['id_topico_forum', 'ASC']]
    });

    return res.status(200).json({ sucesso: true, data: topicos });
  } catch (err) {
    console.error('Erro no COUNT dos posts:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao listar tópicos do fórum da área', erro: err.message });
  }
};

exports.getTopicoForumById = async (req, res) => {
  try {
    const { id } = req.params;
    const topico = await TopicoForum.findOne({
      where: { id_topico_forum: id, ativo: true },
      attributes: {
        include: [
          [Sequelize.literal(`(
            SELECT COUNT(*)
            FROM publicacao AS p
            WHERE p.id_topico_forum = topico_forum.id_topico_forum
              AND p.publicacao_ativa = true
          )`), 'total_posts']
        ]
      },
      include: [{ model: Area, as: 'area', attributes: ['id_area', 'nome_area'] }]
    });

    if (!topico) {
      return res.status(404).json({ sucesso: false, mensagem: 'Tópico do fórum não encontrado ou inativo.' });
    }

    res.status(200).json({ sucesso: true, data: topico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao obter tópico do fórum', erro: err.message });
  }
};

exports.updateTopicoForum = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo_topico, descricao_topico, id_area } = req.body;

    const topico = await TopicoForum.findOne({ where: { id_topico_forum: id, ativo: true } });
    if (!topico) {
      return res.status(404).json({ sucesso: false, mensagem: 'Tópico do fórum não encontrado ou inativo.' });
    }

    if (titulo_topico !== undefined) {
      if (!onlyLettersRegex.test(titulo_topico)) {
        return res.status(400).json({ sucesso: false, mensagem: 'O título contém caracteres inválidos.' });
      }
      topico.titulo_topico = titulo_topico;
    }

    if (descricao_topico !== undefined) {
      topico.descricao_topico = descricao_topico;
    }

    if (id_area !== undefined) {
      const area = await Area.findOne({ where: { id_area, area_ativa: true } });
      if (!area) {
        return res.status(404).json({ sucesso: false, mensagem: 'Área associada não encontrada ou inativa.' });
      }
      topico.id_area = id_area;
    }

    await topico.save();
    res.status(200).json({ sucesso: true, mensagem: 'Tópico do fórum atualizado com sucesso!', data: topico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar tópico do fórum', erro: err.message });
  }
};

exports.deleteTopicoForum = async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await TopicoForum.findOne({ where: { id_topico_forum: id, ativo: true } });
    if (!topico) {
      return res.status(404).json({ sucesso: false, mensagem: 'Tópico do fórum já inativo ou não encontrado.' });
    }

    topico.ativo = false;
    await topico.save();

    res.status(200).json({ sucesso: true, mensagem: 'Tópico do fórum marcado como inativo com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao inativar tópico do fórum', erro: err.message });
  }
};
