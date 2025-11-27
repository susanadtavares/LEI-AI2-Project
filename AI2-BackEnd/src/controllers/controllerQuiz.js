const db = require('../models');
const Quiz = db.quiz;

exports.createQuiz = async (req, res) => {
  try {
    const novo = await Quiz.create(req.body);
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao criar quiz', erro: err.message });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const filtro = req.query.curso ? { where: { id_curso: req.query.curso } } : {};
    const quizzes = await Quiz.findAll(filtro);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar quizzes', erro: err.message });
  }
};


exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (quiz) {
      res.json(quiz);
    } else {
      res.status(404).json({ mensagem: 'Quiz não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar quiz', erro: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (quiz) {
      await quiz.update(req.body);
      res.json(quiz);
    } else {
      res.status(404).json({ mensagem: 'Quiz não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao atualizar quiz', erro: err.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (quiz) {
      await quiz.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ mensagem: 'Quiz não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao eliminar quiz', erro: err.message });
  }
};