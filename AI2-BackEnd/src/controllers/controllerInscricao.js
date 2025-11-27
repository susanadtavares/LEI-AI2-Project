const db = require('../models');
const { sendMail } = require('./controllerEmail');
const Inscricao = db.inscricao;
const Formando = db.formando;
const Utilizador = db.utilizadores;
const Curso = db.curso;
const Formador = db.formador;

exports.createInscricao = async (req, res) => {
  const { id_formando, id_utilizador, id_curso } = req.body;

  try {
    if (!id_formando || !id_utilizador || !id_curso) {
      return res.status(400).json({ mensagem: 'id_formando, id_utilizador e id_curso são obrigatórios.' });
    }

    const formando = await Formando.findByPk(id_formando);
    if (!formando || !formando.formando_ativo) {
      return res.status(404).json({ mensagem: 'Formando não encontrado ou inativo.' });
    }

    const utilizador = await Utilizador.findByPk(id_utilizador);
    if (!utilizador || !utilizador.utilizador_ativo) {
      return res.status(404).json({ mensagem: 'Utilizador não encontrado ou inativo.' });
    }

    if (formando.id_utilizador !== id_utilizador) {
      return res.status(403).json({ mensagem: 'Este utilizador não corresponde ao formando indicado.' });
    }

    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ mensagem: 'Curso não encontrado.' });
    }
    if (!curso.curso_ativo) {
      return res.status(400).json({ mensagem: 'Este curso não está ativo.' });
    }

    if (curso.data_limite_inscricao && new Date() > curso.data_limite_inscricao) {
      return res.status(400).json({ mensagem: 'O prazo de inscrição para este curso já terminou.' });
    }

    const inscricaoAtiva = await Inscricao.findOne({
      where: { id_formando, id_curso, estado: 'ativo' }
    });
    if (inscricaoAtiva) {
      return res.status(409).json({ mensagem: 'O formando já está inscrito neste curso.' });
    }

    const inscricaoInativa = await Inscricao.findOne({
      where: { id_formando, id_curso, estado: 'inativo' }
    });

    if (inscricaoInativa) {
      await inscricaoInativa.update({ estado: 'ativo', data_inscricao: new Date() });
      await curso.update({ membros: curso.membros + 1 });
      await formando.update({ n_cursosinscritos: formando.n_cursosinscritos + 1 });

      if (curso.tipo === 'Sincrono' && curso.id_formador) {
        const formador = await Formador.findByPk(curso.id_formador);
        if (formador) {
          await formador.update({ total_formandos: formador.total_formandos + 1 });
        }
      }

      return res.status(200).json({
        mensagem: 'Inscrição reativada com sucesso!',
        inscricao: inscricaoInativa
      });
    }

    if (curso.num_vagas !== null && curso.membros >= curso.num_vagas) {
      return res.status(400).json({ mensagem: 'Não há vagas disponíveis para este curso.' });
    }

    const novaInscricao = await Inscricao.create({
      id_formando,
      id_utilizador,
      id_curso,
      estado: 'ativo',
      data_inscricao: new Date()
    });

    await curso.update({ membros: curso.membros + 1 });
    await formando.update({ n_cursosinscritos: formando.n_cursosinscritos + 1 });

    if (curso.tipo === 'Sincrono' && curso.id_formador) {
      const formador = await Formador.findByPk(curso.id_formador);
      if (formador) {
        await formador.update({ total_formandos: formador.total_formandos + 1 });
      }
    }

    if (curso.tipo === 'Assincrono' && curso.data_fim && new Date() > curso.data_fim) {
      await formando.update({ n_cursosacabados: formando.n_cursosacabados + 1 });
    }

    try {
      await sendMail({
        to: utilizador.email,
        subject: 'Inscrição Confirmada no Curso',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 30px; border-radius: 12px; border: 1px solid #eee; background-color: #fdfdfd; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); text-align: center;">
            <h2 style="color: #2a9d8f; margin-bottom: 20px;">Inscrição Confirmada</h2>
            <p style="margin: 0;">Olá <strong>${utilizador.nome}</strong>,</p>
            <p style="margin-top: 15px; line-height: 1.6;">
              A tua inscrição no curso <strong>"${curso.titulo}"</strong> foi registada com sucesso.
            </p>
            <p style="line-height: 1.6;">Podes consultar os detalhes do curso na plataforma.</p>
            <div style="margin: 30px 0;">
              <a href="http://tua-plataforma.com" style="background-color: #2a9d8f; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Aceder à Plataforma</a>
            </div>
            <p style="color: #666;">Com os melhores cumprimentos,<br><strong>Equipa Softinsa</strong></p>
          </div>
        `
      });
    } catch (erroEmail) {
      console.error('Erro ao enviar email de confirmação:', erroEmail.message);
    }

    res.status(201).json({
      mensagem: 'Inscrição criada com sucesso!',
      inscricao: novaInscricao
    });

  } catch (err) {
    console.error('Erro ao criar inscrição:', err);
    res.status(500).json({ mensagem: 'Erro interno ao criar inscrição', erro: err.message });
  }
};

exports.deleteInscricao = async (req, res) => {
  try {
    const { id_inscricao } = req.params;

    const registo = await Inscricao.findByPk(id_inscricao);
    if (!registo) {
      return res.status(404).json({ mensagem: 'Inscrição não encontrada.' });
    }

    if (registo.estado === 'inativo') {
      return res.status(400).json({ mensagem: 'Esta inscrição já está anulada.' });
    }

    await registo.update({ estado: 'inativo' });

    const curso = await Curso.findByPk(registo.id_curso);
    if (curso && curso.membros > 0) {
      await curso.update({ membros: curso.membros - 1 });
    }

    const formando = await Formando.findByPk(registo.id_formando);
    if (formando) {
      await formando.update({ n_cursosinscritos: Math.max(0, formando.n_cursosinscritos - 1) });
    }

    if (curso && curso.tipo === 'Sincrono' && curso.id_formador) {
      const formador = await Formador.findByPk(curso.id_formador);
      if (formador && formador.total_formandos > 0) {
        await formador.update({ total_formandos: formador.total_formandos - 1 });
      }
    }

    res.status(200).json({
      mensagem: 'Inscrição anulada com sucesso. O formando já não tem acesso ao curso.'
    });

  } catch (err) {
    console.error('Erro ao anular inscrição:', err);
    res.status(500).json({ mensagem: 'Erro ao anular inscrição', erro: err.message });
  }
};


//formando dever receber email de confirmação de inscrição no curso