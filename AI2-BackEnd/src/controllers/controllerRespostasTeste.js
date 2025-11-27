const { uploadBuffer } = require('./controllerUpload');
const db = require('../models');
const Resposta = db.respostas_teste;
const Teste = db.teste;
const Inscricao = db.inscricao;

//só aceita ficheiros PDF
exports.submeterResposta = async (req, res) => {
  try {
    const { id_utilizador, id_teste, id_formando } = req.body;

    if (!req.file || req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ erro: 'É obrigatório enviar um ficheiro PDF válido.' });
    }

    if (!id_utilizador || !id_teste) {
      return res.status(400).json({ erro: 'id_utilizador e id_teste são obrigatórios.' });
    }

    const teste = await Teste.findByPk(id_teste);
    if (!teste) {
      return res.status(404).json({ erro: 'Teste não encontrado.' });
    }

    if (!teste.teste_ativo) {
      return res.status(403).json({ erro: 'O teste está inativo. Já não é possível submeter ou atualizar a resposta.' });
    }

    const whereInscricao = {
      id_utilizador,
      id_curso: teste.id_curso,
      estado: 'ativo'
    };
    if (id_formando) whereInscricao.id_formando = id_formando;
    const inscricao = await Inscricao.findOne({ where: whereInscricao });

    if (!inscricao) {
      return res.status(403).json({ erro: 'O utilizador não está inscrito ativamente neste curso.' });
    }

    const agora = new Date();
    const dataEntrega = new Date(teste.dataentrega_teste);
    if (agora >= dataEntrega) {
      return res.status(403).json({ erro: 'A data de entrega expirou. Já não é possível submeter ou atualizar a resposta.' });
    }

    const respostaExistente = await Resposta.findOne({
      where: { id_utilizador, id_teste, resposta_ativa: true }
    });

    const cloudinaryUrl = await uploadBuffer(req.file.buffer, 'respostas-teste', 'auto');
    const hora = agora.toTimeString().split(' ')[0];

    let respostaFinal;
    if (respostaExistente) {
      await respostaExistente.update({
        caminho_ficheiro: cloudinaryUrl,
        data: agora,
        hora
      });
      respostaFinal = respostaExistente;
    } else {
      respostaFinal = await Resposta.create({
        id_utilizador,
        id_teste,
        id_formando: id_formando || null,
        caminho_ficheiro: cloudinaryUrl,
        data: agora,
        hora
      });
    }

    res.status(201).json(respostaFinal);
  } catch (err) {
    console.error('Erro ao submeter resposta:', err);
    res.status(500).json({ erro: 'Erro ao submeter resposta' });
  }
};

exports.removerResposta = async (req, res) => {
  try {
    const { id_utilizador, id_teste } = req.params;

    if (!id_utilizador || !id_teste) {
      return res.status(400).json({ erro: 'id_utilizador e id_teste são obrigatórios.' });
    }

    const teste = await db.teste.findByPk(id_teste);
    if (!teste) {
      return res.status(404).json({ erro: 'Teste não encontrado.' });
    }

    if (!teste.teste_ativo) {
      return res.status(403).json({ erro: 'O teste está inativo. Não é possível remover a submissão.' });
    }

    const agora = new Date();
    const dataEntrega = new Date(teste.dataentrega_teste);
    if (agora >= dataEntrega) {
      return res.status(403).json({ erro: 'A data de entrega expirou. Não é possível remover a submissão.' });
    }

    const resposta = await db.respostas_teste.findOne({
      where: {
        id_utilizador,
        id_teste,
        resposta_ativa: true
      }
    });

    if (!resposta) {
      return res.status(404).json({ erro: 'Resposta ativa não encontrada para este teste.' });
    }

    await resposta.update({ resposta_ativa: false });

    res.json({ mensagem: 'Submissão desativada com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover submissão:', err);
    res.status(500).json({ erro: 'Erro ao remover submissão' });
  }
};

exports.getRespostasAtivasPorTeste = async (req, res) => {
  try {
    const { id_teste } = req.params;
    if (!id_teste) return res.status(400).json({ erro: 'id_teste é obrigatório.' });

    const teste = await Teste.findByPk(id_teste);
    if (!teste) return res.status(404).json({ erro: 'Teste não encontrado.' });

    const agora = new Date();
    const prazoExpirou = teste.dataentrega_teste ? new Date(teste.dataentrega_teste) < agora : false;
    const temFlagInativa = (typeof teste.teste_ativo === 'boolean') && !teste.teste_ativo;

    if (temFlagInativa || prazoExpirou) {
      return res.status(403).json({ 
        erro: 'Teste inativo ou prazo expirado.',
        detalhe: { teste_ativo: teste.teste_ativo ?? null, dataentrega_teste: teste.dataentrega_teste }
      });
    }

    const respostas = await Resposta.findAll({
      where: { id_teste, resposta_ativa: true },
      order: [['data', 'DESC'], ['hora', 'DESC']]
    });

    return res.json({
      teste: {
        id_teste: teste.id_teste ?? id_teste,
        teste_ativo: teste.teste_ativo ?? null,
        dataentrega_teste: teste.dataentrega_teste
      },
      respostas
    });
  } catch (err) {
    console.error('Erro ao obter respostas ativas do teste:', err);
    res.status(500).json({ erro: 'Erro ao obter respostas ativas do teste.' });
  }
};