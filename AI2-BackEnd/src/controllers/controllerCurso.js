const db = require('../models');
const Curso = db.curso;
const Aula = db.aula;
const Inscricao = db.inscricao;
const Formando = db.formando;
const Formador = db.formador;
const Utilizador = db.utilizadores;
const { uploadBuffer } = require('./controllerUpload');

function validarDatasCurso(dataInicio, dataFim, dataLimite) {
  const hoje = new Date();
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  const limite = new Date(dataLimite);

  if ([inicio, fim, limite].some(d => isNaN(d))) {
    return 'Datas inválidas.';
  }
  if (inicio <= hoje || fim <= hoje || limite <= hoje) {
    return 'Datas devem ser futuras.';
  }
  if (inicio >= fim) {
    return 'Data de início deve ser anterior à data de fim.';
  }
  if (limite >= inicio) {
    return 'Data limite de inscrição deve ser anterior à data de início.';
  }
  return null; 
}

exports.createCurso = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    let {
      titulo,
      descricao,
      dataInicio,
      dataFim,
      dataLimiteInscricao,
      duracao,
      formador,
      categoria,
      area,
      topico,
      tipo,
      introducao_curso,
      maxVagas,
      criado_por
    } = req.body;

    if (!criado_por) return res.status(403).json({ erro: 'Apenas um gestor pode criar cursos. ID do gestor não informado.' });
    const gestorDB = await db.gestor.findByPk(criado_por, {
      include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['utilizador_ativo'] }]
    });
    if (!gestorDB || !gestorDB.gestor_ativo || !gestorDB.utilizador.utilizador_ativo) {
      return res.status(403).json({ erro: 'Gestor inválido ou inativo.' });
    }

    tipo = (!formador || formador === '0' || formador === 'null') ? 'Assincrono' : 'Sincrono';

    const categoriaId = parseInt(categoria);
    const areaId = parseInt(area);
    const topicoId = parseInt(topico);
    const formadorId = tipo === 'Sincrono' ? parseInt(formador) : null;

    if (!titulo || !descricao || !categoria || !area || !topico) {
      return res.status(400).json({ erro: 'Campos obrigatórios em falta.' });
    }

    const [categoriaDB, areaDB, topicoDB] = await Promise.all([
      db.categoria.findByPk(categoriaId),
      db.area.findByPk(areaId),
      db.topico.findByPk(topicoId)
    ]);
    if (!categoriaDB?.categoria_ativa) return res.status(400).json({ erro: 'Categoria inválida ou inativa.' });
    if (!areaDB?.area_ativa || areaDB.id_categoria !== categoriaId) return res.status(400).json({ erro: 'Área inválida ou não pertence à categoria.' });
    if (!topicoDB?.topico_ativo || topicoDB.id_area !== areaId) return res.status(400).json({ erro: 'Tópico inválido ou não pertence à área.' });

    if (!dataInicio || !dataFim || !dataLimiteInscricao) {
      return res.status(400).json({ erro: 'Cursos precisam de datas de início, fim e limite de inscrição.' });
    }

    const erroDatas = validarDatasCurso(dataInicio, dataFim, dataLimiteInscricao);
    if (erroDatas) return res.status(400).json({ erro: erroDatas });

    const data_inicio = new Date(dataInicio);
    const data_fim = new Date(dataFim);
    const data_limite = new Date(dataLimiteInscricao);

    let duracaoInt = null, vagasInt = null;

    if (tipo === 'Sincrono') {
      if (!maxVagas) return res.status(400).json({ erro: 'Cursos síncronos precisam de número máximo de vagas.' });
      vagasInt = parseInt(maxVagas);
      if (isNaN(vagasInt) || vagasInt <= 0) return res.status(400).json({ erro: 'Número de vagas inválido.' });

      const formadorDB = await db.formador.findByPk(formadorId, {
        include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['utilizador_ativo'] }]
      });
      if (!formadorDB?.formador_ativo || !formadorDB.utilizador?.utilizador_ativo) {
        return res.status(400).json({ erro: 'Formador inválido ou inativo.' });
      }
    }

    if (tipo === 'Assincrono') {
      duracaoInt = duracao ? parseInt(duracao) : null;
      if (!duracaoInt || isNaN(duracaoInt) || duracaoInt <= 0) {
        return res.status(400).json({ erro: 'Cursos assíncronos precisam de uma duração estimada (em horas).' });
      }
    }

    let thumbnailUrl = 'https://res.cloudinary.com/di4up9s9u/image/upload/v1755604007/defaultcurso_w0zceo.png';
    if (req.file) thumbnailUrl = await uploadBuffer(req.file.buffer, 'cursos/thumbnails', 'image');

    const novoCurso = await db.curso.create({
      titulo,
      descricao,
      data_inicio,
      data_fim,
      data_limite_inscricao: data_limite,
      duracao: duracaoInt,
      membros: 0,
      num_vagas: vagasInt,
      id_formador: formadorId,
      id_categoria: categoriaId,
      id_area: areaId,
      id_topico: topicoId,
      tipo,
      introducao_curso,
      tumbnail: thumbnailUrl,
      criado_por,
      curso_ativo: true,
      curso_visivel: true
    }, { transaction: t });

    if (tipo === 'Sincrono' && formadorId) {
      const formadorDB = await db.formador.findByPk(formadorId);
      if (formadorDB) await formadorDB.update({ total_cursos: formadorDB.total_cursos + 1 }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ mensagem: 'Curso criado com sucesso', curso: novoCurso });

  } catch (err) {
    await t.rollback();
    console.error('Erro ao criar curso:', err);
    res.status(500).json({ erro: 'Erro interno ao criar curso' });
  }
};

exports.getCursos = async (req, res) => {
  try {
    const hoje = new Date();

    const cursos = await Curso.findAll({
      where: { curso_ativo: true },
      include: {
        model: Formador,
        as: 'formador',
        attributes: ['formador_ativo'],
        include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['utilizador_ativo', 'nome'] }]
      }
    });

    const cursosProcessados = [];

    for (const curso of cursos) {
      const cursoJson = curso.toJSON();

      if (
        cursoJson.tipo === 'Assincrono' &&
        cursoJson.data_fim &&
        new Date(cursoJson.data_fim) < hoje &&
        cursoJson.curso_visivel !== false
      ) {
        await curso.update({ curso_visivel: false });
        cursoJson.curso_visivel = false;
      }

      cursoJson.nomeFormador =
        cursoJson.formador?.utilizador?.nome &&
        cursoJson.formador.formador_ativo &&
        cursoJson.formador.utilizador.utilizador_ativo
          ? cursoJson.formador.utilizador.nome
          : 'Sem formador';

      const isBackOffice = req.query?.backoffice === 'true';
      if (isBackOffice || cursoJson.curso_visivel !== false) {
        cursosProcessados.push(cursoJson);
      }
    }

    res.status(200).json(cursosProcessados);
  } catch (err) {
    console.error('Erro ao buscar cursos:', err);
    res.status(500).json({ erro: 'Erro ao buscar cursos.' });
  }
};


exports.getCursoById = async (req, res) => {
  try {
    const { id } = req.params;
    const hoje = new Date();
    const isBackOffice = req.query?.backoffice === 'true';

    const curso = await Curso.findByPk(id, {
      include: [
        {
          model: db.formador,
          as: 'formador',
          attributes: ['id_formador', 'formador_ativo'],
          include: [
            { model: db.utilizadores, as: 'utilizador', attributes: ['nome', 'utilizador_ativo'] }
          ]
        },
        { model: db.categoria, as: 'categoria', attributes: ['id_categoria', 'nome_categoria', 'categoria_ativa'] },
        { model: db.area, as: 'area', attributes: ['id_area', 'nome_area', 'area_ativa'] },
        { model: db.topico, as: 'topico', attributes: ['id_topico', 'nome_topico', 'topico_ativo'] }
      ]
    });

    if (!curso) {
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado' });
    }

    const c = curso.toJSON();

    if (!c.curso_ativo) {
      return res.status(404).json({ sucesso: false, mensagem: 'Curso inativo ou removido' });
    }

    if (
      c.tipo === 'Assincrono' &&
      c.data_fim &&
      new Date(c.data_fim) < hoje &&
      c.curso_visivel !== false
    ) {
      await curso.update({ curso_visivel: false });
      c.curso_visivel = false;
    }

    if (!isBackOffice && c.curso_visivel === false) {
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não disponível para alunos.' });
    }

    if (!c.categoria?.categoria_ativa) return res.status(400).json({ sucesso: false, mensagem: 'Categoria associada inativa' });
    if (!c.area?.area_ativa) return res.status(400).json({ sucesso: false, mensagem: 'Área associada inativa' });
    if (!c.topico?.topico_ativo) return res.status(400).json({ sucesso: false, mensagem: 'Tópico associado inativo' });

    c.nomeFormador =
      c.tipo === 'Sincrono' &&
      c.formador?.formador_ativo &&
      c.formador?.utilizador?.utilizador_ativo
        ? c.formador.utilizador.nome
        : 'Sem formador';

    res.status(200).json({ sucesso: true, data: c });
  } catch (err) {
    console.error('Erro ao buscar curso por ID:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao buscar curso', erro: err.message });
  }
};

exports.getCursosByCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const hoje = new Date();
    const isBackOffice = req.query?.backoffice === 'true';

    const categoria = await db.categoria.findByPk(id_categoria);
    if (!categoria || !categoria.categoria_ativa) {
      return res.status(404).json({ sucesso: false, mensagem: 'Categoria não encontrada ou inativa.' });
    }

    const cursos = await Curso.findAll({
      where: { id_categoria, curso_ativo: true },
      include: {
        model: Formador,
        as: 'formador',
        attributes: ['formador_ativo'],
        include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['utilizador_ativo', 'nome'] }]
      }
    });

    const cursosProcessados = [];

    for (const curso of cursos) {
      const c = curso.toJSON();

      if (
        c.tipo === 'Assincrono' &&
        c.data_fim &&
        new Date(c.data_fim) < hoje &&
        c.curso_visivel !== false
      ) {
        await curso.update({ curso_visivel: false });
        c.curso_visivel = false;
      }

      c.nomeFormador =
        c.formador?.utilizador?.nome &&
        c.formador.formador_ativo &&
        c.formador.utilizador.utilizador_ativo
          ? c.formador.utilizador.nome
          : 'Sem formador';

      if (isBackOffice || c.curso_visivel !== false) {
        cursosProcessados.push(c);
      }
    }

    res.status(200).json({ sucesso: true, data: cursosProcessados });
  } catch (err) {
    console.error('Erro ao buscar cursos por categoria:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao buscar cursos por categoria', erro: err.message });
  }
};

exports.getCursosByArea = async (req, res) => {
  try {
    const { id_area } = req.params;
    const hoje = new Date();
    const isBackOffice = req.isBackOffice || req.query?.backoffice === 'true';

    const area = await db.area.findByPk(id_area);
    if (!area || !area.area_ativa) {
      return res.status(404).json({ sucesso: false, mensagem: 'Área não encontrada ou inativa.' });
    }

    const cursos = await Curso.findAll({
      where: { id_area, curso_ativo: true },
      include: {
        model: Formador,
        as: 'formador',
        attributes: ['formador_ativo'],
        include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['utilizador_ativo', 'nome'] }]
      }
    });

    const cursosProcessados = [];

    for (const curso of cursos) {
      const c = curso.toJSON();

      if (
        c.tipo === 'Assincrono' &&
        c.data_fim &&
        new Date(c.data_fim) < hoje &&
        c.curso_visivel !== false
      ) {
        await curso.update({ curso_visivel: false });
        c.curso_visivel = false;
      }

      c.nomeFormador =
        c.formador?.utilizador?.nome &&
        c.formador.formador_ativo &&
        c.formador.utilizador.utilizador_ativo
          ? c.formador.utilizador.nome
          : 'Sem formador';

      if (isBackOffice || c.curso_visivel !== false) {
        cursosProcessados.push(c);
      }
    }

    res.status(200).json({ sucesso: true, data: cursosProcessados });
  } catch (err) {
    console.error('Erro ao buscar cursos por área:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao buscar cursos por área', erro: err.message });
  }
};

exports.getCursosByTopico = async (req, res) => {
  try {
    const { id_topico } = req.params;
    const hoje = new Date();
    const isBackOffice = req.isBackOffice || req.query?.backoffice === 'true';

    const topico = await db.topico.findByPk(id_topico);
    if (!topico || !topico.topico_ativo) {
      return res.status(404).json({ sucesso: false, mensagem: 'Tópico não encontrado ou inativo.' });
    }

    const cursos = await Curso.findAll({
      where: { id_topico, curso_ativo: true },
      include: {
        model: Formador,
        as: 'formador',
        attributes: ['formador_ativo'],
        include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['utilizador_ativo', 'nome'] }]
      }
    });

    const cursosProcessados = [];

    for (const curso of cursos) {
      const c = curso.toJSON();

      if (
        c.tipo === 'Assincrono' &&
        c.data_fim &&
        new Date(c.data_fim) < hoje &&
        c.curso_visivel !== false
      ) {
        await curso.update({ curso_visivel: false });
        c.curso_visivel = false;
      }

      c.nomeFormador =
        c.formador?.utilizador?.nome &&
        c.formador.formador_ativo &&
        c.formador.utilizador.utilizador_ativo
          ? c.formador.utilizador.nome
          : 'Sem formador';

      if (isBackOffice || c.curso_visivel !== false) {
        cursosProcessados.push(c);
      }
    }

    res.status(200).json({ sucesso: true, data: cursosProcessados });
  } catch (err) {
    console.error('Erro ao buscar cursos por tópico:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao buscar cursos por tópico', erro: err.message });
  }
};

exports.updateCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await db.curso.findByPk(id);

    if (!curso || !curso.curso_ativo) {
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado ou inativo.' });
    }

    const camposBloqueados = ['tipo', 'id_formador', 'id_categoria', 'id_area', 'id_topico', 'data_inicio', 'data_fim'];
    for (const campo of camposBloqueados) {
      if (req.body[campo] !== undefined) {
        return res.status(400).json({ sucesso: false, mensagem: `O campo '${campo}' não pode ser alterado após a criação do curso.` });
      }
    }

    const inscritos = await db.inscricao.count({
      where: { id_curso: id, estado: 'ativo' }
    });

    const {
      titulo,
      descricao,
      data_limite_inscricao,
      duracao,
      maxVagas,
      introducao_curso,
      curso_visivel 
    } = req.body;

    const dadosAtualizados = {};

    if (titulo) dadosAtualizados.titulo = titulo;
    if (descricao !== undefined) dadosAtualizados.descricao = descricao;
    if (introducao_curso) dadosAtualizados.introducao_curso = introducao_curso;

    if (duracao !== undefined) {
      const dur = parseInt(duracao);
      if (curso.tipo === 'Sincrono') {
        return res.status(400).json({ sucesso: false, mensagem: 'Não é permitido alterar a duração de cursos síncronos.' });
      }
      if (isNaN(dur) || dur <= 0) {
        return res.status(400).json({ sucesso: false, mensagem: 'Duração inválida.' });
      }
      dadosAtualizados.duracao = dur;
    }

    if (curso.tipo === 'Sincrono') {
      if (data_limite_inscricao) {
        const novaDataLimite = new Date(data_limite_inscricao);
        if (isNaN(novaDataLimite)) return res.status(400).json({ sucesso: false, mensagem: 'Data limite inválida.' });
        if (novaDataLimite >= new Date(curso.data_inicio)) return res.status(400).json({ sucesso: false, mensagem: 'Data limite deve ser antes da data de início.' });
        dadosAtualizados.data_limite_inscricao = novaDataLimite;
      }

      if (maxVagas !== undefined) {
        const novoMaxVagas = parseInt(maxVagas);
        if (isNaN(novoMaxVagas) || novoMaxVagas <= 0) return res.status(400).json({ sucesso: false, mensagem: 'Número máximo de vagas inválido.' });
        if (novoMaxVagas < inscritos) return res.status(400).json({ sucesso: false, mensagem: `Número de vagas não pode ser menor que inscritos (${inscritos}).` });
        if (new Date(curso.data_limite_inscricao) < new Date()) return res.status(400).json({ sucesso: false, mensagem: 'Não é permitido alterar vagas após o fim do período de inscrições.' });
        dadosAtualizados.num_vagas = novoMaxVagas;
      }
    }

    if (curso.tipo === 'Assincrono' && (data_limite_inscricao || maxVagas !== undefined)) {
      return res.status(400).json({ sucesso: false, mensagem: 'Cursos assíncronos não possuem limite de inscrições/vagas.' });
    }

    if (curso_visivel !== undefined) {
      dadosAtualizados.curso_visivel = curso_visivel;
    }

    const hoje = new Date();
    if (curso.tipo === 'Assincrono' && curso.data_fim && new Date(curso.data_fim) < hoje) {
      dadosAtualizados.curso_visivel = false;
    }

    if (req.file) {
      dadosAtualizados.tumbnail = await uploadBuffer(req.file.buffer, 'cursos/thumbnails', 'image');
    }

    await curso.update(dadosAtualizados);
    res.status(200).json({ sucesso: true, mensagem: 'Curso atualizado com sucesso!', data: curso });

  } catch (err) {
    console.error('Erro ao atualizar curso:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao atualizar curso', erro: err.message });
  }
};

exports.deleteCurso = async (req, res) => {
  const { id } = req.params;
  const { softDelete } = req.query; 
  const t = await db.sequelize.transaction();

  try {
    const curso = await db.curso.findByPk(id, { transaction: t });

    if (!curso) {
      await t.rollback();
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado.' });
    }

    if (softDelete === 'true') {
      await curso.update({ curso_visivel: false }, { transaction: t });
      await t.commit();
      return res.status(200).json({ sucesso: true, mensagem: 'Curso ocultado (soft delete) com sucesso.' });
    }

    if (!curso.curso_ativo) {
      await t.rollback();
      return res.status(400).json({ sucesso: false, mensagem: 'Curso já está inativo.' });
    }

    await curso.update({ curso_ativo: false, membros: 0, curso_visivel: false }, { transaction: t });

    await db.inscricao.update(
      { estado: 'inativo' },
      { where: { id_curso: id }, transaction: t }
    );

    if (db.aula) {
      await db.aula.update({ aula_ativa: false }, { where: { id_curso: id }, transaction: t });
      if (db.anexo_aula) {
        const aulas = await db.aula.findAll({ where: { id_curso: id }, attributes: ['id_aula'], transaction: t });
        const aulaIds = aulas.map(a => a.id_aula);
        if (aulaIds.length) {
          await db.anexo_aula.update({ anexo_aula_ativo: false }, { where: { id_aula: aulaIds }, transaction: t });
        }
      }
    }

    if (db.quiz) {
      await db.quiz.update({ quiz_ativo: false }, { where: { id_curso: id }, transaction: t });
    }

    if (curso.tipo === 'Sincrono' && db.teste) {
      await db.teste.update({ teste_ativo: false }, { where: { id_curso: id }, transaction: t });
    }

    if (curso.tipo === 'Sincrono' && curso.id_formador) {
      const formador = await db.formador.findByPk(curso.id_formador, { transaction: t });
      if (formador && formador.total_cursos > 0) {
        await formador.update({ total_cursos: formador.total_cursos - 1 }, { transaction: t });
      }
    }

    await t.commit();
    res.status(200).json({ sucesso: true, mensagem: 'Curso e recursos associados inativados com sucesso.' });

  } catch (err) {
    await t.rollback();
    console.error('Erro ao inativar curso:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao inativar curso.', erro: err.message });
  }
};


exports.getMembrosDoCurso = async (req, res) => {
  const { id_curso } = req.params;

  try {
    const curso = await Curso.findByPk(id_curso, {
      attributes: ['id_curso', 'titulo', 'curso_ativo'],
      include: [{
        model: Formador,
        as: 'formador',
        attributes: ['id_formador', 'formador_ativo'],
        include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['nome', 'utilizador_ativo'] }]
      }]
    });

    if (!curso || !curso.curso_ativo) {
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado ou inativo.' });
    }

    const inscricoes = await Inscricao.findAll({
      where: { id_curso, estado: 'ativo' },
      include: [{
        model: Formando,
        as: 'formando',
        attributes: ['id_formando', 'formando_ativo', 'foto_perfil'],
        include: [{ model: db.utilizadores, as: 'utilizador', attributes: ['nome', 'email', 'utilizador_ativo'] }]
      }]
    });

    const membros = [];
    for (const i of inscricoes) {
      if (!i.formando?.formando_ativo || !i.formando.utilizador?.utilizador_ativo) continue;

      const testes = await db.resultado_teste.findAll({
        where: { id_formando: i.formando.id_formando, id_curso },
        attributes: ['nota']
      });

      const mediaNota = testes.length > 0
        ? (testes.reduce((sum, t) => sum + t.nota, 0) / testes.length).toFixed(1)
        : null;

      membros.push({
        id_formando: i.formando.id_formando,
        nome: i.formando.utilizador.nome,
        email: i.formando.utilizador.email,
        foto: i.formando.foto_perfil || '/uploads/default-user.png',
        nota: mediaNota
      });
    }

    membros.sort((a, b) => a.nome.localeCompare(b.nome));

    res.status(200).json({
      sucesso: true,
      curso: { id_curso: curso.id_curso, titulo: curso.titulo },
      formador: {
        id_formador: curso.formador?.id_formador || null,
        nome: (curso.formador?.formador_ativo && curso.formador.utilizador?.utilizador_ativo)
          ? curso.formador.utilizador.nome
          : 'Formador inativo'
      },
      membros
    });

  } catch (err) {
    console.error('Erro ao buscar membros do curso:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar membros', erro: err.message });
  }
};

exports.ocultarCurso = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await db.curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado.' });
    }

    if (!curso.curso_ativo) {
      return res.status(400).json({ sucesso: false, mensagem: 'Curso está inativo e não pode ser ocultado.' });
    }

    if (!curso.curso_visivel) {
      return res.status(400).json({ sucesso: false, mensagem: 'Curso já está oculto.' });
    }

    await curso.update({ curso_visivel: false });

    res.status(200).json({ sucesso: true, mensagem: 'Curso ocultado com sucesso!', data: curso });
  } catch (err) {
    console.error('Erro ao ocultar curso:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao ocultar curso', erro: err.message });
  }
};

exports.desocultarCurso = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await db.curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado.' });
    }

    if (!curso.curso_ativo) {
      return res.status(400).json({ sucesso: false, mensagem: 'Curso está inativo e não pode ser desocultado.' });
    }

    if (curso.curso_visivel) {
      return res.status(400).json({ sucesso: false, mensagem: 'Curso já está visível.' });
    }

    await curso.update({ curso_visivel: true });

    res.status(200).json({ sucesso: true, mensagem: 'Curso desocultado com sucesso!', data: curso });
  } catch (err) {
    console.error('Erro ao desocultar curso:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao desocultar curso', erro: err.message });
  }
};

exports.adicionarMembroAoCurso = async (req, res) => {
  try {
    const { id_formando, id_utilizador } = req.body;
    const { id: id_curso } = req.params;

    if (!id_formando || !id_utilizador || !id_curso) {
      return res.status(400).json({ sucesso: false, mensagem: 'id_formando, id_utilizador e id_curso são obrigatórios.' });
    }

    const formando = await Formando.findByPk(id_formando);
    if (!formando || !formando.formando_ativo) {
      return res.status(404).json({ sucesso: false, mensagem: 'Formando não encontrado ou está inativo.' });
    }

    const utilizador = await Utilizador.findByPk(id_utilizador);
    if (!utilizador || !utilizador.utilizador_ativo) {
      return res.status(404).json({ sucesso: false, mensagem: 'Utilizador não encontrado ou está inativo.' });
    }

    if (formando.id_utilizador !== id_utilizador) {
      return res.status(400).json({ sucesso: false, mensagem: 'Este utilizador não corresponde ao formando indicado.' });
    }

    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado.' });
    }

    if (!curso.curso_ativo) {
      return res.status(400).json({ sucesso: false, mensagem: 'Este curso não está ativo.' });
    }

    if (curso.data_limite_inscricao && new Date() > curso.data_limite_inscricao) {
      return res.status(400).json({ sucesso: false, mensagem: 'O prazo de inscrição para este curso já terminou.' });
    }

    const inscricaoAtiva = await Inscricao.findOne({
      where: { id_formando, id_curso, estado: 'ativo' }
    });
    if (inscricaoAtiva) {
      return res.status(400).json({ sucesso: false, mensagem: 'O formando já está inscrito neste curso.' });
    }

    const inscricaoInativa = await Inscricao.findOne({
      where: { id_formando, id_curso, estado: 'inativo' }
    });

    let inscricao;

    if (inscricaoInativa) {
      await inscricaoInativa.update({ estado: 'ativo', data_inscricao: new Date() });
      inscricao = inscricaoInativa;
    } else {
      if (curso.num_vagas !== null && curso.membros >= curso.num_vagas) {
        return res.status(400).json({ sucesso: false, mensagem: 'Não há vagas disponíveis para este curso.' });
      }

      inscricao = await Inscricao.create({
        id_formando,
        id_utilizador,
        id_curso,
        estado: 'ativo',
        data_inscricao: new Date(),
        adicionado_gestor: true
      });
    }

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

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Formando adicionado com sucesso ao curso.',
      inscricao
    });

  } catch (erro) {
    console.error('Erro ao adicionar membro ao curso:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao adicionar membro.', erro: erro.message });
  }
};

exports.removerMembroDoCurso = async (req, res) => {
  try {
    const { id } = req.params; 
    const { id_formando, id_utilizador } = req.body;

    if (!id_formando || !id_utilizador || !id) {
      return res.status(400).json({ sucesso: false, mensagem: 'Dados obrigatórios em falta.' });
    }

    const formando = await Formando.findByPk(id_formando);
    const utilizador = await Utilizador.findByPk(id_utilizador);
    const curso = await Curso.findByPk(id);

    if (!formando || !formando.formando_ativo) {
      return res.status(404).json({ sucesso: false, mensagem: 'Formando não encontrado ou inativo.' });
    }

    if (!utilizador || !utilizador.utilizador_ativo) {
      return res.status(404).json({ sucesso: false, mensagem: 'Utilizador não encontrado ou inativo.' });
    }

    if (formando.id_utilizador !== id_utilizador) {
      return res.status(400).json({ sucesso: false, mensagem: 'Utilizador não corresponde ao formando.' });
    }

    if (!curso || !curso.curso_ativo) {
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado ou inativo.' });
    }

    const inscricao = await Inscricao.findOne({
      where: { id_formando, id_curso: id, estado: 'ativo' }
    });

    if (!inscricao) {
      return res.status(404).json({ sucesso: false, mensagem: 'Inscrição não encontrada.' });
    }

    await inscricao.update({ estado: 'inativo' });
    await curso.update({ membros: Math.max(0, curso.membros - 1) });
    await formando.update({ n_cursosinscritos: Math.max(0, formando.n_cursosinscritos - 1) });

    if (curso.tipo === 'Sincrono' && curso.id_formador) {
      const formador = await Formador.findByPk(curso.id_formador);
      if (formador) {
        await formador.update({ total_formandos: Math.max(0, formador.total_formandos - 1) });
      }
    }

    return res.json({
      sucesso: true,
      mensagem: 'Membro removido com sucesso do curso.',
      inscricao
    });

  } catch (erro) {
    console.error('Erro ao remover membro:', erro.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.', erro: erro.message });
  }
};