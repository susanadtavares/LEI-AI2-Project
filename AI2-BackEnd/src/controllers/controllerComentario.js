const db = require('../models');
const Comentario = db.comentario;
const Publicacao = db.publicacao;
const Utilizadores = db.utilizadores;
const TopicoForum = db.topico_forum;

exports.createComentario = async (req, res) => {
  try {
    const { id_publicacao, id_utilizador, descricao_comentario, parent_id } = req.body;
    console.log('Criando comentário:', { id_publicacao, id_utilizador, descricao_comentario, parent_id });

    if (!id_publicacao || !id_utilizador || !descricao_comentario?.trim()) {
      return res.status(400).json({
        erro: 'Campos obrigatórios em falta: id_publicacao, id_utilizador, descricao_comentario'
      });
    }

    if (descricao_comentario.trim().length > 256) {
      return res.status(400).json({ erro: 'descricao_comentario excede 256 caracteres.' });
    }

    const [pub, autor] = await Promise.all([
      Publicacao.findByPk(id_publicacao, {
        include: [{ model: TopicoForum, as: 'topico_forum' }],
      }),
      Utilizadores.findByPk(id_utilizador),
    ]);

    if (!pub) return res.status(404).json({ erro: 'A publicação indicada não existe.' });
    if (!autor) return res.status(404).json({ erro: 'O utilizador indicado não existe.' });

    if (pub.publicacao_ativa !== true) {
      return res.status(400).json({ erro: 'A publicação está inativa.' });
    }
    if (!pub.topico_forum || pub.topico_forum.ativo !== true) {
      return res.status(400).json({ erro: 'O tópico do fórum está inativo.' });
    }

    if (parent_id) {
      const parent = await Comentario.scope('withHidden').findByPk(parent_id);
      if (!parent) {
        console.warn(`parent_id ${parent_id} não encontrado, ignorando.`);
        parent_id = null;
      } else if (parent.id_publicacao !== Number(id_publicacao)) {
        return res.status(400).json({ erro: 'parent_id pertence a outra publicação.' });
      } else if (parent.oculto === true) {
        return res.status(400).json({ erro: 'O comentário pai está oculto/inativo.' });
      }
    }

    const novo = await Comentario.create({
      id_publicacao,
      id_utilizador,
      descricao_comentario: descricao_comentario.trim(),
      parent_id: parent_id ?? null,
      data_comentario: db.sequelize.fn('NOW'),
      oculto: false,
    });

    console.log('Comentário criado:', novo.toJSON());
    return res.status(201).json(novo);
  } catch (err) {
    console.error('Erro ao criar comentário:', err);
    return res.status(500).json({ erro: 'Erro ao criar comentário', detalhes: err.message });
  }
};

exports.getComentariosByPublicacao = async (req, res) => {
  try {
    const { id_publicacao } = req.params;

    if (!id_publicacao) {
      return res.status(400).json({ erro: 'O id_publicacao é obrigatório.' });
    }

    const publicacao = await Publicacao.findOne({
      where: { id_publicacao: Number(id_publicacao), publicacao_ativa: true }
    });
    if (!publicacao) {
      return res.status(404).json({ erro: 'Publicação não encontrada ou inativa.' });
    }

    const comentarios = await Comentario.findAll({
      where: { id_publicacao: Number(id_publicacao), oculto: false },
      order: [['data_comentario', 'ASC']],
      include: [
        {
          model: Utilizadores,
          as: 'autor',
          attributes: ['id_utilizador', 'nome', 'email'],
          required: true,
        },
      ],
    });

    console.log('Comentários encontrados:', comentarios.map(c => c.toJSON()));
    return res.status(200).json(comentarios);
  } catch (err) {
    console.error('Erro ao buscar comentários:', err);
    return res.status(500).json({ erro: 'Erro ao buscar comentários por publicação', detalhes: err.message });
  }
};

exports.getComentarioById = async (req, res) => {
  try {
    const comentarioId = Number(req.params.id);

    const comentarioPrincipal = await Comentario.findByPk(comentarioId, {
      where: { oculto: false }, 
      include: [
        {
          model: Utilizadores,
          as: 'autor',
          attributes: ['id_utilizador', 'nome', 'email'],
          required: true,
        },
      ],
    });

    if (!comentarioPrincipal) {
      return res.status(404).json({ mensagem: 'Comentário não encontrado ou inativo' });
    }

    const todosComentarios = await Comentario.findAll({
      where: { id_publicacao: comentarioPrincipal.id_publicacao, oculto: false }, 
      order: [['data_comentario', 'ASC']],
      include: [
        {
          model: Utilizadores,
          as: 'autor',
          attributes: ['id_utilizador', 'nome', 'email'],
          required: true,
        },
      ],
    });

    const map = new Map();
    todosComentarios.forEach(c => {
      map.set(c.id_comentario, { ...c.toJSON(), replies: [] });
    });

    todosComentarios.forEach(c => {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).replies.push(map.get(c.id_comentario));
      }
    });

    const resultado = map.get(comentarioId);
    if (!resultado) {
      return res.status(404).json({ mensagem: 'Comentário não encontrado ou inativo' });
    }

    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Erro ao buscar comentário:', err);
    return res.status(500).json({ mensagem: 'Erro ao buscar comentário', erro: err.message });
  }
};

exports.deleteComentario = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const comentario = await Comentario.scope('withHidden').findByPk(req.params.id);
    if (!comentario) {
      await t.rollback();
      return res.status(404).json({ mensagem: 'Comentário não encontrado' });
    }

    console.log('Comentário a ser excluído:', comentario.toJSON()); 

    const todos = await Comentario.scope('withHidden').findAll({
      where: { id_publicacao: comentario.id_publicacao },
      attributes: ['idcomentario', 'parent_id'],
      transaction: t,
    });

    const getDescendants = (rows, rootId, depth = 0, maxDepth = 10) => {
      if (depth > maxDepth) {
        console.warn(`Profundidade máxima (${maxDepth}) atingida para rootId ${rootId}, evitando loop infinito`);
        return [];
      }
      const filhos = rows
        .filter(r => r.parent_id === rootId)
        .map(r => r.idcomentario);
      for (const id of filhos) {
        filhos.push(...getDescendants(rows, id, depth + 1, maxDepth));
      }
      return filhos;
    };

    const idsParaOcultar = [
      comentario.idcomentario,
      ...getDescendants(todos, comentario.idcomentario),
    ];

    console.log('IDs a ocultar antes de validação:', idsParaOcultar); 
    if (idsParaOcultar.length === 0) {
      console.warn('Nenhum ID a ocultar encontrado para o comentário:', comentario.idcomentario);
    }

    const validIds = idsParaOcultar.filter(id => todos.some(r => r.idcomentario === id));
    if (validIds.length !== idsParaOcultar.length) {
      console.warn('IDs inválidos filtrados:', idsParaOcultar.filter(id => !validIds.includes(id)));
    }

    if (validIds.length > 0) {
      console.log('Executando update com IDs:', validIds); 
      await Comentario.update(
        { oculto: true }, 
        { where: { idcomentario: validIds }, transaction: t }
      );
    } else {
      console.warn('Nenhum ID válido para atualizar, operação ignorada para comentário:', comentario.idcomentario);
      await t.commit();
      return res.status(204).send();
    }

    await t.commit();
    return res.status(204).send();
  } catch (err) {
    await t.rollback();
    console.error('Erro ao apagar comentário:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    return res.status(500).json({ mensagem: 'Erro ao apagar comentário', erro: err.message, stack: err.stack });
  }
};
