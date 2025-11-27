const db = require('../models');
const Topico = db.topico;
const Area = db.area;
const Categoria = db.categoria;

const onlyLettersRegex = /^[A-Za-zÀ-ÿ\s]+$/;

exports.createTopico = async (req, res) => {
  try {
    const { nome_topico, id_area } = req.body;

    if (!nome_topico || !id_area) {
      return res.status(400).json({ sucesso: false, mensagem: 'O nome do tópico e o ID da área são obrigatórios.' });
    }

    if (!onlyLettersRegex.test(nome_topico)) {
      return res.status(400).json({ sucesso: false, mensagem: 'O nome do tópico deve conter apenas letras.' });
    }

    const area = await Area.findOne({
      where: { id_area, area_ativa: true },
      include: [{ model: Categoria, as: 'categoria', where: { categoria_ativa: true }, required: true }]
    });

    if (!area) {
      return res.status(404).json({ sucesso: false, mensagem: 'Área associada não encontrada ou inativa.' });
    }

    const novoTopico = await Topico.create({ nome_topico, id_area, topico_ativo: true });
    res.status(201).json({ sucesso: true, mensagem: 'Tópico criado com sucesso!', data: novoTopico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar tópico', erro: err.message });
  }
};

exports.getTopicos = async (req, res) => {
  try {
    const topicos = await Topico.findAll({
      where: { topico_ativo: true },
      include: [
        {
          model: Area,
          as: 'area',
          where: { area_ativa: true },
          include: [{ model: Categoria, as: 'categoria', where: { categoria_ativa: true } }]
        }
      ],
      order: [['id_topico', 'ASC']]
    });

    res.status(200).json({ sucesso: true, data: topicos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao encontrar tópicos', erro: err.message });
  }
};

exports.getTopicoById = async (req, res) => {
  try {
    const { id } = req.params;
    const topico = await Topico.findOne({
      where: { id_topico: id, topico_ativo: true },
      include: [
        {
          model: Area,
          as: 'area',
          where: { area_ativa: true },
          include: [{ model: Categoria, as: 'categoria', where: { categoria_ativa: true } }]
        }
      ]
    });

    if (!topico) {
      return res.status(404).json({ sucesso: false, mensagem: 'Tópico não encontrado ou inativo.' });
    }

    res.status(200).json({ sucesso: true, data: topico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar tópico', erro: err.message });
  }
};

exports.updateTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_topico, id_area } = req.body;

    const topico = await Topico.findOne({ where: { id_topico: id, topico_ativo: true } });
    if (!topico) {
      return res.status(404).json({ sucesso: false, mensagem: 'Tópico não encontrado ou inativo.' });
    }

    if (nome_topico !== undefined) {
      if (!onlyLettersRegex.test(nome_topico)) {
        return res.status(400).json({ sucesso: false, mensagem: 'O nome do tópico deve conter apenas letras.' });
      }
      topico.nome_topico = nome_topico;
    }

    if (id_area !== undefined) {
      const area = await Area.findOne({
        where: { id_area, area_ativa: true },
        include: [{ model: Categoria, as: 'categoria', where: { categoria_ativa: true }, required: true }]
      });
      if (!area) {
        return res.status(404).json({ sucesso: false, mensagem: 'Área associada não encontrada ou inativa.' });
      }
      topico.id_area = id_area;
    }

    await topico.save();
    res.status(200).json({ sucesso: true, mensagem: 'Tópico atualizado com sucesso!', data: topico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar tópico', erro: err.message });
  }
};

exports.deleteTopico = async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await Topico.findOne({ where: { id_topico: id, topico_ativo: true } });
    if (!topico) {
      return res.status(404).json({ sucesso: false, mensagem: 'Tópico já inativo ou não encontrado.' });
    }

    const cursosAssociados = await db.curso.count({
      where: { id_topico: id, curso_ativo: true }
    });

    if (cursosAssociados > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível inativar este tópico, pois existem cursos ativos associados a ele.'
      });
    }

    topico.topico_ativo = false;
    await topico.save();

    res.status(200).json({ sucesso: true, mensagem: 'Tópico marcado como inativo com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao inativar tópico', erro: err.message });
  }
};
