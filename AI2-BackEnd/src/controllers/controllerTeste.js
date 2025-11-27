const { uploadBuffer } = require('./controllerUpload');
const db = require('../models');
const Teste = db.teste;
const Curso = db.curso;

exports.criarTeste = async (req, res) => {
  try {
    const {
      id_curso,
      titulo_teste,
      descricao_teste,
      dataentrega_teste
    } = req.body;

    if (!id_curso || !titulo_teste || !descricao_teste || !dataentrega_teste) {
      return res.status(400).json({
        erro: 'Campos obrigatórios em falta: id_curso, titulo_teste, descricao_teste, dataentrega_teste'
      });
    }

    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ erro: 'O curso indicado não existe.' });
    }

    //tolerar acentos/maiúsculas no tipo
    const tipoNorm = String(curso.tipo || '').normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (tipoNorm !== 'Sincrono') {
      return res.status(400).json({ erro: 'Apenas cursos do tipo Sincrono podem ter testes.' });
    }

    //normalizar datas para meia-noite (evita timezone e “hoje” a meio do dia)
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const dataEntrega = new Date(dataentrega_teste); dataEntrega.setHours(0,0,0,0);
    const dataFimCurso = curso.data_fim ? new Date(curso.data_fim) : null;
    if (dataFimCurso) dataFimCurso.setHours(0,0,0,0);

    if (isNaN(dataEntrega)) return res.status(400).json({ erro: 'dataentrega_teste inválida.' });
    if (dataEntrega <= hoje) return res.status(400).json({ erro: 'A data de entrega deve ser maior que a data atual.' });
    if (dataFimCurso && dataEntrega > dataFimCurso) {
      return res.status(400).json({ erro: 'A data de entrega deve ser anterior ou igual à data de fim do curso.' });
    }

    if (!req.file || req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ erro: 'É obrigatório enviar um ficheiro PDF válido.' });
    }

    const cloudinaryUrl = await uploadBuffer(req.file.buffer, 'testes-pdf', 'auto');

    const novoTeste = await Teste.create({
      id_curso,
      titulo_teste,
      descricao_teste,
      dataentrega_teste: dataEntrega,
      anexo_teste: cloudinaryUrl
    });

    res.status(201).json(novoTeste);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar teste', detalhes: err.message });
  }
};

exports.getTestes = async (req, res) => {
  try {
    const filtro = {
      where: {
        ...(req.query.curso && { id_curso: req.query.curso }),
        teste_ativo: true
      }
    };

    const testes = await db.teste.findAll(filtro);
    res.json(testes);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar testes', erro: err.message });
  }
};

exports.getTesteById = async (req, res) => {
  try {
    const teste = await Teste.findOne({
      where: {
        id_teste: req.params.id,
        teste_ativo: true
      }
    });

    if (teste) {
      res.json(teste);
    } else {
      res.status(404).json({ mensagem: 'Teste não encontrado ou está desativado.' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar teste', erro: err.message });
  }
};

exports.updateTeste = async (req, res) => {
  try {
    const teste = await Teste.findOne({
      where: {
        id_teste: req.params.id,
        teste_ativo: true
      }
    });

    if (!teste) {
      return res.status(404).json({ mensagem: 'Teste não encontrado ou está desativado' });
    }

    const atualizacoes = req.body;

    if (atualizacoes.dataentrega_teste) {
      const curso = await Curso.findByPk(teste.id_curso);
      if (!curso) {
        return res.status(404).json({ erro: 'Curso associado ao teste não encontrado.' });
      }

      const novaData = new Date(atualizacoes.dataentrega_teste);
      const hoje = new Date();
      const dataFimCurso = new Date(curso.data_fim);

      if (novaData <= hoje) {
        return res.status(400).json({ erro: 'A nova data de entrega deve ser maior que hoje.' });
      }

      if (novaData > dataFimCurso) {
        return res.status(400).json({ erro: 'A nova data de entrega deve ser anterior ou igual à data de fim do curso.' });
      }
    }

    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ erro: 'Apenas ficheiros PDF são permitidos.' });
      }

      const novoUrl = await uploadBuffer(req.file.buffer, 'testes-pdf', 'auto');
      atualizacoes.anexo_teste = novoUrl;
    }

    await teste.update(atualizacoes);
    res.json(teste);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: 'Erro ao atualizar teste', erro: err.message });
  }
};


exports.deleteTeste = async (req, res) => {
  try {
    const teste = await Teste.findOne({
      where: {
        id_teste: req.params.id,
        teste_ativo: true
      }
    });

    if (!teste) {
      return res.status(404).json({ mensagem: 'Teste não encontrado ou já está desativado' });
    }

    await teste.update({ teste_ativo: false });

    res.status(200).json({ mensagem: 'Teste desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao desativar teste', erro: err.message });
  }
};