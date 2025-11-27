const db = require('../models');
const Formando = db.formando;
const Utilizador = db.utilizadores;

//gerar certificado on the fly

exports.getFormandos = async (req, res) => {
  try {
    console.log('Iniciando busca de formandos...');
    console.log('Associações do Formando:', Object.keys(Formando.associations));
    const formandos = await Formando.findAll({
      where: { formando_ativo: true },
      include: [{
        model: Utilizador,
        as: 'utilizador',
        attributes: ['id_utilizador', 'nome', 'email']
      }]
    });
    console.log('Formandos encontrados:', JSON.stringify(formandos, null, 2));
    res.json(formandos);
  } catch (err) {
    console.error('Erro ao buscar formandos:', err.message, err.stack);
    res.status(500).json({ mensagem: 'Erro ao buscar formandos', erro: err.message });
  }
};

exports.getFormandoById = async (req, res) => {
  try {
    const formando = await Formando.findOne({
      where: {
        id_utilizador: req.params.id_utilizador,
        id_formando: req.params.id_formando,
        formando_ativo: true
      }
    });

    if (formando) {
      res.json(formando);
    } else {
      res.status(404).json({ mensagem: 'Formando não encontrado ou está desativado' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar formando', erro: err.message });
  }
};

exports.updateFormandoFull = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id_utilizador, id_formando } = req.params;
    const { foto_perfil, nome, email, telemovel, genero, data_nascimento } = req.body;

    const formando = await Formando.findOne({ where: { id_utilizador, id_formando, formando_ativo: true }, transaction: t });
    if (!formando) return res.status(404).json({ mensagem: 'Formando não encontrado' });

    const utilizador = await Utilizador.findByPk(id_utilizador, { transaction: t });
    if (!utilizador) return res.status(404).json({ mensagem: 'Utilizador não encontrado' });

    if (foto_perfil !== undefined) await formando.update({ foto_perfil }, { transaction: t });
    await utilizador.update({ nome, email, telemovel, genero, data_nascimento }, { transaction: t });

    await t.commit();
    res.json({ mensagem: 'Formando + Utilizador atualizados.' });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ mensagem: 'Erro ao atualizar', erro: err.message });
  }
};

exports.deleteFormando = async (req, res) => {
  try {
    const formando = await Formando.findOne({
      where: {
        id_utilizador: req.params.id_utilizador,
        id_formando: req.params.id_formando
      }
    });

    if (!formando) return res.status(404).json({ mensagem: 'Formando não encontrado' });

    await formando.update({ formando_ativo: false });
    await Utilizador.update({ utilizador_ativo: false }, { where: { id_utilizador: req.params.id_utilizador } });

    res.status(200).json({ mensagem: 'Formando e utilizador associado desativados com sucesso' });

  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao desativar formando', erro: err.message });
  }
};

exports.getFormandoFullById = async (req, res) => {
  try {
    const formando = await Formando.findOne({
      where: {
        id_utilizador: req.params.id_utilizador,
        id_formando: req.params.id_formando,
        formando_ativo: true
      },
      include: [{
        model: Utilizador,
        as: 'utilizador',
        attributes: ['id_utilizador', 'nome', 'email', 'telemovel', 'genero', 'data_nascimento', 'utilizador_ativo']
      }]
    });

    if (!formando) {
      return res.status(404).json({ mensagem: 'Formando não encontrado ou está desativado' });
    }

    const u = formando.utilizador || {};
    res.json({
      id_formando: formando.id_formando,
      id_utilizador: formando.id_utilizador,
      foto_perfil: formando.foto_perfil,
      nome: u.nome ?? '',
      email: u.email ?? '',
      telemovel: u.telemovel ?? '',
      genero: u.genero ?? '',
      data_nascimento: u.data_nascimento ?? null
    });
  } catch (err) {
    console.error('Erro ao buscar formando completo:', err);
    res.status(500).json({ mensagem: 'Erro ao buscar formando completo', erro: err.message });
  }
};