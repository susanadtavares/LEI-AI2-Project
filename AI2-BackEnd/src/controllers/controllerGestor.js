const db = require('../models');
const Gestor = db.gestor;

exports.getGestores = async (req, res) => {
  try {
    const gestores = await Gestor.findAll();
    res.status(200).json(gestores);
  } catch (err) {
    console.error("Erro ao buscar gestores:", err);
    res.status(500).json({ mensagem: 'Erro ao buscar gestores', erro: err.message });
  }
};

exports.getGestorById = async (req, res) => {
  try {
    const gestor = await Gestor.findByPk(req.params.id_gestor);

    if (!gestor) {
      return res.status(404).json({ mensagem: 'Gestor não encontrado' });
    }

    res.status(200).json(gestor);
  } catch (err) {
    console.error("Erro ao buscar gestor:", err);
    res.status(500).json({ mensagem: 'Erro ao buscar gestor', erro: err.message });
  }
};