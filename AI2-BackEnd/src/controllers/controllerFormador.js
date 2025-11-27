const db = require('../models');
const Formador = db.formador;
const Utilizador = db.utilizadores;

exports.getFormadores = async (req, res) => {
  try {
    console.log('Iniciando busca de formadores...');
    console.log('Associações do Formador:', Object.keys(Formador.associations));
    const formadores = await Formador.findAll({
      where: { formador_ativo: true },
      include: [{
        model: Utilizador,
        as: 'utilizador',
        attributes: ['id_utilizador', 'nome', 'email']
      }]
    });
    console.log('Formadores encontrados:', JSON.stringify(formadores, null, 2));
    res.json(formadores);
  } catch (err) {
    console.error('Erro ao buscar formadores:', err.message, err.stack);
    res.status(500).json({ mensagem: 'Erro ao buscar formadores', erro: err.message });
  }
};

exports.getFormadorById = async (req, res) => {
  try {
    const formador = await Formador.findOne({
      where: {
        id_utilizador: req.params.id_utilizador,
        id_formador: req.params.id_formador,
        formador_ativo: true
      }
    });

    if (formador) {
      res.json(formador);
    } else {
      res.status(404).json({ mensagem: 'Formador não encontrado ou está desativado' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar formador', erro: err.message });
  }
};

exports.updateFormadorFull = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id_utilizador, id_formador } = req.params;
    const { foto_perfil, nome, email, telemovel, genero, data_nascimento } = req.body;

    const formador = await Formador.findOne({ where: { id_utilizador, id_formador, formador_ativo: true }, transaction: t });
    if (!formador) return res.status(404).json({ mensagem: 'Formador não encontrado' });

    const utilizador = await Utilizador.findByPk(id_utilizador, { transaction: t });
    if (!utilizador) return res.status(404).json({ mensagem: 'Utilizador não encontrado' });

    if (foto_perfil !== undefined) await formador.update({ foto_perfil }, { transaction: t });
    await utilizador.update({ nome, email, telemovel, genero, data_nascimento }, { transaction: t });

    await t.commit();
    res.json({ mensagem: 'Formador + Utilizador atualizados.' });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ mensagem: 'Erro ao atualizar', erro: err.message });
  }
};

exports.deleteFormador = async (req, res) => {
  try {
    const formador = await Formador.findOne({
      where: {
        id_utilizador: req.params.id_utilizador,
        id_formador: req.params.id_formador
      }
    });

    if (!formador) return res.status(404).json({ mensagem: 'Formador não encontrado' });

    await formador.update({ formador_ativo: false });
    await Utilizador.update({ utilizador_ativo: false }, { where: { id_utilizador: req.params.id_utilizador } });

    res.status(200).json({ mensagem: 'Formador e utilizador associado desativados com sucesso' });

  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao desativar formador', erro: err.message });
  }
};

exports.getFormadorFullById = async (req, res) => {
  try {
    const formador = await Formador.findOne({
      where: {
        id_utilizador: req.params.id_utilizador,
        id_formador: req.params.id_formador,
        formador_ativo: true
      },
      include: [{
        model: Utilizador,
        as: 'utilizador',
        attributes: ['id_utilizador','nome','email','telemovel','genero','data_nascimento','utilizador_ativo']
      }]
    });

    if (!formador) {
      return res.status(404).json({ mensagem: 'Formador não encontrado ou está desativado' });
    }

    const u = formador.utilizador || {};
    res.json({
      id_formador: formador.id_formador,
      id_utilizador: formador.id_utilizador,
      foto_perfil: formador.foto_perfil,
      nome: u.nome ?? '',
      email: u.email ?? '',
      telemovel: u.telemovel ?? '',
      genero: u.genero ?? '',
      data_nascimento: u.data_nascimento ?? null
    });
  } catch (err) {
    console.error('Erro ao buscar formador completo:', err);
    res.status(500).json({ mensagem: 'Erro ao buscar formador completo', erro: err.message });
  }
};

