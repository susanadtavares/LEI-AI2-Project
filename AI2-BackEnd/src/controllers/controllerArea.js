const db = require('../models');
const Area = db.area;
const Categoria = db.categoria;

const onlyLettersRegex = /^[A-Za-zÀ-ÿ\s]+$/;

exports.createArea = async (req, res) => {
  try {
    const { id_categoria, nome_area } = req.body;

    if (!nome_area || !id_categoria) {
      return res.status(400).json({ sucesso: false, mensagem: 'O nome da área e o ID da categoria são obrigatórios.' });
    }

    if (!onlyLettersRegex.test(nome_area)) {
      return res.status(400).json({ sucesso: false, mensagem: 'O nome da área deve conter apenas letras.' });
    }

    const categoria = await Categoria.findOne({ where: { id_categoria, categoria_ativa: true } });
    if (!categoria) {
      return res.status(404).json({ sucesso: false, mensagem: 'Categoria associada não encontrada ou inativa.' });
    }

    const novaArea = await Area.create({ nome_area, id_categoria, area_ativa: true });
    res.status(201).json({ sucesso: true, mensagem: 'Área criada com sucesso!', data: novaArea });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar área', erro: error.message });
  }
};

exports.getAreas = async (req, res) => {
  try {
    const areas = await Area.findAll({
      where: { area_ativa: true },
      include: [{ model: Categoria, as: 'categoria', attributes: ['id_categoria', 'nome_categoria'] }],
      order: [['id_area', 'ASC']]
    });

    res.status(200).json({ sucesso: true, data: areas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar áreas', erro: error.message });
  }
};

exports.getAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findOne({
      where: { id_area: id, area_ativa: true },
      include: [{ model: Categoria, as: 'categoria', attributes: ['id_categoria', 'nome_categoria'] }]
    });

    if (!area) {
      return res.status(404).json({ sucesso: false, mensagem: 'Área não encontrada ou inativa.' });
    }

    res.status(200).json({ sucesso: true, data: area });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar área', erro: error.message });
  }
};

exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_categoria, nome_area } = req.body;

    const area = await Area.findOne({ where: { id_area: id, area_ativa: true } });
    if (!area) {
      return res.status(404).json({ sucesso: false, mensagem: 'Área não encontrada ou inativa.' });
    }

    if (nome_area !== undefined) {
      if (!onlyLettersRegex.test(nome_area)) {
        return res.status(400).json({ sucesso: false, mensagem: 'O nome da área deve conter apenas letras.' });
      }
      area.nome_area = nome_area;
    }

    if (id_categoria !== undefined) {
      const categoria = await Categoria.findOne({ where: { id_categoria, categoria_ativa: true } });
      if (!categoria) {
        return res.status(404).json({ sucesso: false, mensagem: 'Categoria associada não encontrada ou inativa.' });
      }
      area.id_categoria = id_categoria;
    }

    await area.save();
    res.status(200).json({ sucesso: true, mensagem: 'Área atualizada com sucesso!', data: area });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar área', erro: error.message });
  }
};

exports.deleteArea = async (req, res) => {
  try {
    const { id } = req.params;

    const area = await Area.findOne({ where: { id_area: id, area_ativa: true } });
    if (!area) {
      return res.status(404).json({ sucesso: false, mensagem: 'Área já inativa ou não encontrada.' });
    }

    const cursosAssociados = await db.curso.count({
      where: { id_area: id, curso_ativo: true }
    });

    if (cursosAssociados > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível inativar esta área, pois existem cursos associados a ela.'
      });
    }

    area.area_ativa = false;
    await area.save();

    res.status(200).json({ sucesso: true, mensagem: 'Área marcada como inativa com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao inativar área', erro: error.message });
  }
};


exports.getTopicosByArea = async (req, res) => {
  try {
    const { id } = req.params;

    const area = await Area.findOne({
      where: { id_area: id, area_ativa: true },
      include: [
        {
          model: db.topico,
          as: 'topicos',
          where: { topico_ativo: true },
          required: false,
          order: [['id_topico', 'ASC']]
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome_categoria']
        }
      ]
    });

    if (!area) {
      return res.status(404).json({ sucesso: false, mensagem: 'Área não encontrada ou inativa.' });
    }

    res.status(200).json({ sucesso: true, data: area });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao listar tópicos da área', erro: err.message });
  }
};

