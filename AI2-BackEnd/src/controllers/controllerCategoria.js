const db = require('../models');
const Categoria = db.categoria;

const onlyLettersRegex = /^[A-Za-zÀ-ÿ\s]+$/;

exports.createCategoria = async (req, res) => {
  try {
    const { nome_categoria } = req.body;

    if (!nome_categoria || nome_categoria.trim() === '') {
      return res.status(400).json({ sucesso: false, mensagem: 'O nome da categoria é obrigatório.' });
    }

    if (!onlyLettersRegex.test(nome_categoria)) {
      return res.status(400).json({ sucesso: false, mensagem: 'O nome da categoria deve conter apenas letras.' });
    }

    const novaCategoria = await Categoria.create({ nome_categoria, categoria_ativa: true });
    res.status(201).json({ sucesso: true, mensagem: 'Categoria criada com sucesso!', data: novaCategoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar categoria', erro: error.message });
  }
};

exports.getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      where: { categoria_ativa: true },
      order: [['id_categoria', 'ASC']]
    });

    res.status(200).json({ sucesso: true, data: categorias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao obter categorias', erro: error.message });
  }
};

exports.getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findOne({
      where: { id_categoria: id, categoria_ativa: true }
    });

    if (!categoria) {
      return res.status(404).json({ sucesso: false, mensagem: 'Categoria não encontrada ou inativa' });
    }

    res.status(200).json({ sucesso: true, data: categoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao obter categoria', erro: error.message });
  }
};

exports.updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_categoria } = req.body;

    const categoria = await Categoria.findOne({
      where: { id_categoria: id, categoria_ativa: true }
    });

    if (!categoria) {
      return res.status(404).json({ sucesso: false, mensagem: 'Categoria não encontrada ou inativa' });
    }

    if (nome_categoria !== undefined) {
      if (!onlyLettersRegex.test(nome_categoria)) {
        return res.status(400).json({ sucesso: false, mensagem: 'O nome da categoria deve conter apenas letras.' });
      }
      categoria.nome_categoria = nome_categoria;
    }

    await categoria.save();
    res.status(200).json({ sucesso: true, mensagem: 'Categoria atualizada com sucesso!', data: categoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar categoria', erro: error.message });
  }
};

exports.deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findOne({
      where: { id_categoria: id, categoria_ativa: true }
    });

    if (!categoria) {
      return res.status(404).json({ sucesso: false, mensagem: 'Categoria já inativa ou não encontrada' });
    }

    const cursosAssociados = await db.curso.count({
      where: { id_categoria: id, curso_ativo: true }
    });

    if (cursosAssociados > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível inativar esta categoria, pois existem cursos associados a ela.'
      });
    }

    categoria.categoria_ativa = false;
    await categoria.save();

    res.status(200).json({ sucesso: true, mensagem: 'Categoria marcada como inativa com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao inativar categoria', erro: error.message });
  }
};


exports.getAreasETopicosByCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findOne({
      where: { id_categoria: id, categoria_ativa: true },
      include: [{
        model: db.area,
        as: 'areas',
        where: { area_ativa: true },
        required: false,
        include: [{
          model: db.topico,
          as: 'topicos',
          where: { topico_ativo: true },
          required: false,
          separate: true,
          order: [['id_topico', 'ASC']]
        }],
        separate: true,
        order: [['id_area', 'ASC']]
      }]
    });

    if (!categoria) {
      return res.status(404).json({ sucesso: false, mensagem: 'Categoria não encontrada ou inativa.' });
    }

    res.status(200).json({ sucesso: true, data: categoria });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao listar áreas e tópicos da categoria', erro: err.message });
  }
};
