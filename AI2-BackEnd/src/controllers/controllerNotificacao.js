const db = require('../models');
const Notificacao = db.notificacao;
const Utilizadores = db.utilizadores;
const Curso = db.curso;
const Notificar = db.notificar;

exports.getMinhasNotificacoes = async (req, res) => {
  const { id_utilizador } = req.params;

  try {
    const utilizador = await Utilizadores.findOne({
      where: {
        id_utilizador,
        utilizador_ativo: true  
      }
    });

    if (!utilizador) {
      return res.status(404).json({ mensagem: 'Utilizador não encontrado ou inativo' });
    }

    const notificacoes = await utilizador.getNotificacoes({
      where: { estado: 'ativa' },
      joinTableAttributes: ['notificacao_ativa'],
      include: [
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'titulo']
        }
      ],
      through: {
        where: { notificacao_ativa: true } 
      },
      order: [['data_notificacao', 'DESC']]
    });

    res.json(notificacoes);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar notificações do utilizador', erro: err.message });
  }
};

exports.marcarComoLida = async (req, res) => {
  const { id_utilizador, id_notificacao } = req.params;

  try {
    const ligacao = await Notificar.findOne({
      where: { id_utilizador, id_notificacao }
    });

    if (!ligacao) {
      return res.status(404).json({ mensagem: 'Ligação não encontrada' });
    }

    if (!ligacao.notificacao_ativa) {
      return res.status(400).json({ mensagem: 'Esta notificação já foi eliminada e não pode ser marcada como lida.' });
    }

    const notificacao = await Notificacao.findByPk(id_notificacao);
    if (!notificacao) {
      return res.status(404).json({ mensagem: 'Notificação não encontrada' });
    }

    if (notificacao.estado === 'ativa') {
      await notificacao.update({ estado: 'lida' });
    }

    res.json({ mensagem: 'Notificação marcada como lida com sucesso.' });
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao marcar como lida', erro: err.message });
  }
};


exports.softDeleteNotificacao = async (req, res) => {
  const { id_utilizador, id_notificacao } = req.params;

  try {
    const ligacao = await Notificar.findOne({
      where: { id_utilizador, id_notificacao }
    });

    if (!ligacao) {
      return res.status(404).json({ mensagem: 'Ligação não encontrada' });
    }

    if (!ligacao.notificacao_ativa) {
      return res.status(400).json({ mensagem: 'Notificação já foi eliminada anteriormente.' });
    }

    ligacao.notificacao_ativa = false;
    await ligacao.save();

    const notificacao = await Notificacao.findByPk(id_notificacao);
    if (notificacao && notificacao.estado !== 'arquivada') {
      await notificacao.update({ estado: 'arquivada' });
    }

    res.json({ mensagem: 'Notificação eliminada (arquivada) com sucesso.' });
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao eliminar notificação', erro: err.message });
  }
};



