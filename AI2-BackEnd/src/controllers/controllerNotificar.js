const db = require('../models');
const Notificar = db.notificar;

exports.createNotificacaoEnviada = async (req, res) => {
  try {
    const nova = await Notificar.create(req.body);
    res.status(201).json(nova);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao registar envio', erro: err.message });
  }
};

exports.getNotificacoesEnviadas = async (req, res) => {
  try {
    const registros = await Notificar.findAll();
    res.json(registros);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar notificações enviadas', erro: err.message });
  }
};

exports.deleteNotificacaoEnviada = async (req, res) => {
  try {
    const encontrada = await Notificar.findOne({
      where: {
        id_utilizador: req.params.id_utilizador,
        id_notificacao: req.params.id_notificacao
      }
    });

    if (encontrada) {
      await encontrada.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ mensagem: 'Ligação não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao eliminar envio', erro: err.message });
  }
};