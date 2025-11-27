const db = require('../models');
const RespostaQuiz = db.respostas_quiz;

exports.createRespostaQuiz = async (req, res) => {
  try {
    const nova = await RespostaQuiz.create(req.body);
    res.status(201).json(nova);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao criar resposta', erro: err.message });
  }
};

exports.getRespostasQuiz = async (req, res) => {
  try {
    const respostas = await RespostaQuiz.findAll();
    res.json(respostas);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar respostas', erro: err.message });
  }
};

exports.getRespostaQuizById = async (req, res) => {
  try {
    const resposta = await RespostaQuiz.findByPk(req.params.id);
    if (resposta) {
      res.json(resposta);
    } else {
      res.status(404).json({ mensagem: 'Resposta não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar resposta', erro: err.message });
  }
};

exports.updateRespostaQuiz = async (req, res) => {
  try {
    const resposta = await RespostaQuiz.findByPk(req.params.id);
    if (resposta) {
      await resposta.update(req.body);
      res.json(resposta);
    } else {
      res.status(404).json({ mensagem: 'Resposta não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao atualizar resposta', erro: err.message });
  }
};

exports.deleteRespostaQuiz = async (req, res) => {
  try {
    const resposta = await RespostaQuiz.findByPk(req.params.id);
    if (resposta) {
      await resposta.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ mensagem: 'Resposta não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao eliminar resposta', erro: err.message });
  }
};