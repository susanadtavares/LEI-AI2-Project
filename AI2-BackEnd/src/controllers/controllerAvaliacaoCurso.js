const db = require('../models');
const AvaliacaoCurso = db.avaliacao_curso;
const Curso = db.curso;
const Formando = db.formando;
const Inscricao = db.inscricao;
const Quiz = db.quiz;
const RespostaQuiz = db.respostas_quiz;

exports.createAvaliacao = async (req, res) => {
  try {
    const { id_curso, id_formando, id_utilizador, n_estrelas, comentario } = req.body;

    if (!id_curso || !id_formando || !id_utilizador || n_estrelas === undefined) {
      return res.status(400).json({ mensagem: 'Campos obrigatórios em falta.' });
    }
    if (n_estrelas < 0 || n_estrelas > 5) {
      return res.status(400).json({ mensagem: 'A avaliação deve ser entre 0 e 5 estrelas.' });
    }

    const curso = await Curso.findByPk(id_curso);
    if (!curso || !curso.curso_ativo) {
      return res.status(404).json({ mensagem: 'Curso não encontrado ou inativo.' });
    }

    const formando = await Formando.findByPk(id_formando, {
      include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['utilizador_ativo'] }]
    });
    if (!formando || !formando.formando_ativo || !formando.utilizador.utilizador_ativo) {
      return res.status(403).json({ mensagem: 'Formando inválido ou inativo.' });
    }

    const inscricao = await Inscricao.findOne({ where: { id_curso, id_formando, estado: 'ativo' } });
    if (!inscricao) {
      return res.status(403).json({ mensagem: 'O formando não está inscrito neste curso.' });
    }

    const avaliacaoExistente = await AvaliacaoCurso.findOne({
      where: { id_curso, id_formando, avaliacao_curso_ativa: true }
    });
    if (avaliacaoExistente) {
      return res.status(400).json({ mensagem: 'Já existe uma avaliação para este curso.' });
    }

    let concluido = false;

    if (curso.tipo === 'Sincrono') {
      concluido = new Date(curso.data_fim) <= new Date();
    } else {
      const quizzes = await Quiz.findAll({ where: { id_curso, quiz_ativo: true } });
      const respostas = await RespostaQuiz.findAll({ where: { id_formando } });
      const respondidos = new Set(respostas.map(r => r.id_quiz));
      concluido = quizzes.length > 0 && quizzes.every(q => respondidos.has(q.id_quiz));
    }

    if (!concluido) {
      return res.status(403).json({ mensagem: 'Só é possível avaliar após concluir o curso.' });
    }

    const agora = new Date();
    const dataAtual = agora.toISOString().split('T')[0];
    const horaAtual = agora.toTimeString().split(' ')[0];

    const nova = await AvaliacaoCurso.create({
      id_curso,
      id_formando,
      id_utilizador,
      n_estrelas,
      comentario,
      data: dataAtual,
      hora: horaAtual,
      avaliacao_curso_ativa: true
    });

    const avaliacoes = await AvaliacaoCurso.findAll({
      where: { id_curso, avaliacao_curso_ativa: true }
    });

    const mediaEstrelas = (
      avaliacoes.reduce((sum, a) => sum + parseFloat(a.n_estrelas), 0) / avaliacoes.length
    ).toFixed(1);

    await curso.update({ avaliacao: mediaEstrelas });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Avaliação publicada com sucesso!',
      data: nova
    });

  } catch (err) {
    console.error('Erro ao criar avaliação:', err);
    res.status(500).json({ mensagem: 'Erro ao criar avaliação', erro: err.message });
  }
};


exports.deleteAvaliacao = async (req, res) => {
  try {
    const avaliacao = await AvaliacaoCurso.findByPk(req.params.id);

    if (!avaliacao) {
      return res.status(404).json({ mensagem: 'Avaliação não encontrada' });
    }

    if (!avaliacao.avaliacao_curso_ativa) {
      return res.status(400).json({ mensagem: 'A avaliação já está desativada.' });
    }

    await avaliacao.update({ avaliacao_curso_ativa: false });

    const avaliacoesAtivas = await AvaliacaoCurso.findAll({
      where: { id_curso: avaliacao.id_curso, avaliacao_curso_ativa: true }
    });

    const mediaEstrelas = avaliacoesAtivas.length > 0
      ? (avaliacoesAtivas.reduce((sum, a) => sum + parseFloat(a.n_estrelas), 0) / avaliacoesAtivas.length).toFixed(1)
      : 0;

    await Curso.update({ avaliacao: mediaEstrelas }, { where: { id_curso: avaliacao.id_curso } });


    res.status(200).json({ sucesso: true, mensagem: 'Avaliação desativada com sucesso.' });

  } catch (err) {
    console.error('Erro ao eliminar avaliação:', err);
    res.status(500).json({ mensagem: 'Erro ao eliminar avaliação', erro: err.message });
  }
};

exports.getAvaliacoesByCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;

    const curso = await Curso.findByPk(id_curso);
    if (!curso || !curso.curso_ativo) {
      return res.status(404).json({ mensagem: 'Curso não encontrado ou inativo.' });
    }

    let avaliacoes = await AvaliacaoCurso.findAll({
      where: { id_curso, avaliacao_curso_ativa: true },
      include: [
        {
          model: db.formando,
          as: 'formando',
          attributes: ['id_formando', 'foto_perfil', 'formando_ativo'], 
          include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['nome', 'utilizador_ativo'] }]
        }
      ],
      order: [['data', 'DESC'], ['hora', 'DESC']]
    });


    if (!avaliacoes || avaliacoes.length === 0) {
      return res.status(200).json({ sucesso: true, mediaEstrelas: 0, totalAvaliacoes: 0, avaliacoes: [] });
    }

    const quizzes = curso.tipo === 'Assincrono'
      ? await Quiz.findAll({ where: { id_curso, quiz_ativo: true } })
      : [];

    const respostasQuiz = curso.tipo === 'Assincrono'
      ? await RespostaQuiz.findAll()
      : [];

    avaliacoes = avaliacoes.filter(a => {
      const f = a.formando;
      if (!f?.formando_ativo || !f.utilizador?.utilizador_ativo) return false;

      if (curso.tipo === 'Sincrono') {
        return new Date(curso.data_fim) <= new Date();
      } else {
        const respondidos = new Set(respostasQuiz.filter(r => r.id_formando === f.id_formando).map(r => r.id_quiz));
        return quizzes.length > 0 && quizzes.every(q => respondidos.has(q.id_quiz));
      }
    });

    if (avaliacoes.length === 0) {
      return res.status(200).json({ sucesso: true, mediaEstrelas: 0, totalAvaliacoes: 0, avaliacoes: [] });
    }

    const mediaEstrelas = (
      avaliacoes.reduce((sum, a) => sum + parseFloat(a.n_estrelas), 0) / avaliacoes.length
    ).toFixed(1);

    await curso.update({ avaliacao: mediaEstrelas });

    res.status(200).json({
      sucesso: true,
      mediaEstrelas,
      totalAvaliacoes: avaliacoes.length,
      avaliacoes
    });

  } catch (err) {
    console.error('Erro ao listar avaliações do curso:', err);
    res.status(500).json({ mensagem: 'Erro ao listar avaliações do curso', erro: err.message });
  }
};

