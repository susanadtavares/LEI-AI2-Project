const { Sequelize } = require('sequelize');
const db = require('../models');
const Denuncia = db.denuncia;
const Publicacao = db.publicacao;
const Comentario = db.comentario;
const Utilizadores = db.utilizadores;

exports.criarDenuncia = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id_publicacao, idcomentario, motivo } = req.body; // Use idcomentario
    const id_utilizador = req.user.id || req.user.id_utilizador;

    console.log('Received request:', { id_publicacao, idcomentario, motivo, id_utilizador });

    const usuario = await db.utilizadores.findOne({
      where: { id_utilizador, utilizador_ativo: true },
      transaction: t,
    });
    if (!usuario) {
      await t.rollback();
      return res.status(403).json({ erro: 'Utilizador inativo ou inexistente.' });
    }

    const isFormador = await db.formador.findOne({
      where: { id_utilizador, formador_ativo: true },
      transaction: t,
    });
    const isFormando = await db.formando.findOne({
      where: { id_utilizador, formando_ativo: true },
      transaction: t,
    });

    if (!isFormador && !isFormando) {
      await t.rollback();
      return res.status(403).json({ erro: 'Apenas formadores e formandos podem denunciar publicações ou comentários.' });
    }

    if (!id_publicacao && !idcomentario) {
      await t.rollback();
      return res.status(400).json({ erro: 'Deve ser informado o ID de uma publicação ou comentário para denúncia.' });
    }

    let publicacao = null;
    if (id_publicacao) {
      publicacao = await db.publicacao.findOne({
        where: { id_publicacao, publicacao_ativa: true },
        transaction: t,
      });
      if (!publicacao) {
        await t.rollback();
        return res.status(404).json({ erro: 'Publicação não encontrada ou inativa.' });
      }
    }

    let comentario = null;
    if (idcomentario) {
      comentario = await db.comentario.scope('withHidden').findOne({
        where: { idcomentario },
        transaction: t,
      });
      console.log('Found comentario:', comentario);
      if (!comentario) {
        await t.rollback();
        return res.status(404).json({ erro: 'Comentário não encontrado.' });
      }
    }

    const denunciaExistente = await db.denuncia.findOne({
      where: {
        [Sequelize.Op.or]: [
          id_publicacao ? { id_publicacao, id_utilizador } : null,
          idcomentario ? { idcomentario, id_utilizador } : null, // Use idcomentario
        ].filter(Boolean),
        estado: 'pendente',
      },
      transaction: t,
    });

    if (denunciaExistente) {
      await t.rollback();
      return res.status(400).json({ erro: 'Você já denunciou esta publicação ou comentário.' });
    }

    const novaDenuncia = await db.denuncia.create(
      {
        id_utilizador,
        id_publicacao: id_publicacao || null,
        idcomentario: idcomentario || null, // Use idcomentario
        motivo,
        data_denuncia: Sequelize.fn('NOW'),
        estado: 'pendente',
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({
      sucesso: true,
      mensagem: 'Denúncia criada com sucesso!',
      denuncia: novaDenuncia,
    });
  } catch (err) {
    await t.rollback();
    console.error('Erro ao criar denúncia:', err);
    return res.status(500).json({ erro: 'Erro ao criar denúncia', detalhes: err.message });
  }
};

exports.listarDenuncias = async (req, res) => {
    const { limit = 10, offset = 0 } = req.query; // Removidos estado, dataInicio, dataFim
    const user = req.user;

    console.log('Listando denúncias para usuário:', user?.id, 'com filtros:', { limit, offset });

    if (!user || !user.role) {
        return res.status(401).json({ mensagem: 'Usuário não autenticado ou sem role definida.' });
    }

    const isGestor = user.role === 'Gestor' || user.role === 'gestor';
    if (!isGestor) {
        return res.status(403).json({ mensagem: 'Apenas gestores podem visualizar denúncias.' });
    }

    const parsedLimit = parseInt(limit) || 10;
    const parsedOffset = parseInt(offset) || 0;
    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
        return res.status(400).json({ mensagem: 'Parâmetros limit e offset devem ser numéricos.' });
    }

    try {
        await db.sequelize.query('SELECT 1');
        console.log('Conexão com o banco bem-sucedida');

        const whereClause = {};
        const include = [
            {
                model: db.publicacao,
                as: 'publicacao',
                include: [
                    {
                        model: db.utilizadores,
                        as: 'autor',
                        attributes: ['id_utilizador', 'nome', 'email']
                    },
                    {
                        model: db.topico_forum,
                        as: 'topico_forum',
                        include: [
                            {
                                model: db.area,
                                as: 'area',
                                attributes: ['nome_area']
                            }
                        ]
                    },
                    {
                        model: db.anexo_publicacao,
                        as: 'anexos',
                        required: false
                    }
                ],
                required: false
            },
            {
                model: db.comentario,
                as: 'comentario',
                include: [
                    {
                        model: db.utilizadores,
                        as: 'autor',
                        attributes: ['id_utilizador', 'nome', 'email']
                    },
                    {
                        model: db.publicacao,
                        as: 'publicacao',
                        include: [
                            {
                                model: db.topico_forum,
                                as: 'topico_forum',
                                include: [
                                    {
                                        model: db.area,
                                        as: 'area',
                                        attributes: ['nome_area']
                                    }
                                ]
                            }
                        ]
                    }
                ],
                required: false
            },
            {
                model: db.utilizadores,
                as: 'denunciante',
                attributes: ['id_utilizador', 'nome', 'email'],
                include: [
                    {
                        model: db.formador,
                        as: 'formador',
                        attributes: ['foto_perfil'],
                        required: false
                    },
                    {
                        model: db.formando,
                        as: 'formando',
                        attributes: ['foto_perfil'],
                        required: false
                    }
                ]
            }
        ];

        console.log('Consulta SQL preparada:', whereClause, include);

        const denuncias = await Denuncia.findAndCountAll({
            where: whereClause,
            include: include,
            order: [['data_denuncia', 'DESC']],
            limit: parsedLimit,
            offset: parsedOffset,
            logging: console.log
        });

        console.log('Resultado da consulta:', denuncias);

        return res.status(200).json({
            sucesso: true,
            total: denuncias.count,
            data: denuncias.rows
        });

    } catch (err) {
        console.error('Erro ao listar denúncias:', err.stack);
        return res.status(500).json({ mensagem: 'Erro ao buscar denúncias', erro: err.message, stack: err.stack });
    }
};

exports.resolverDenuncia = async (req, res) => {
  console.log('ResolverDenuncia hit for id_denuncia:', req.params.id_denuncia, 'with headers:', req.headers, 'and body:', req.body);
  const t = await db.sequelize.transaction();
  try {
    const { id_denuncia } = req.params;
    const { acao_tomada, estado } = req.body;
    const id_utilizador = req.user.id || req.user.id_utilizador;

    if (!req.user || !req.user.role) {
      await t.rollback();
      return res.status(401).json({ mensagem: 'Usuário não autenticado ou sem role definida.' });
    }

    console.log('User role checked:', req.user.role);
    const isGestor = req.user.role.toLowerCase() === 'gestor';
    if (!isGestor) {
      await t.rollback();
      return res.status(403).json({ mensagem: 'Apenas gestores podem resolver denúncias.' });
    }

    const denuncia = await db.denuncia.findOne({
      where: { id_denuncia },
      include: [
        { model: db.publicacao, as: 'publicacao', required: false },
        { model: db.comentario, as: 'comentario', required: false, where: {} }
      ],
      transaction: t,
    });
    if (!denuncia) {
      await t.rollback();
      console.log('Denuncia not found for id:', id_denuncia);
      return res.status(404).json({ mensagem: 'Denúncia não encontrada.' });
    }

    await denuncia.update({
      estado: estado || 'resolvida',
      acao_tomada,
      id_utilizador_responsavel: id_utilizador,
      data_resolucao: Sequelize.fn('NOW'),
    }, { transaction: t });

    if (estado === 'aprovado') { // Only hide on approval
      if (denuncia.id_publicacao) {
        const publicacao = await db.publicacao.findByPk(denuncia.id_publicacao, { transaction: t });
        if (publicacao) {
          publicacao.publicacao_ativa = false;
          await publicacao.save({ transaction: t });
          await db.anexo_publicacao.update(
            { anexo_publicacao_ativo: false },
            { where: { id_publicacao: publicacao.id_publicacao }, transaction: t }
          );
        }
      } else if (denuncia.idcomentario) {
        const comentario = await db.comentario.scope('withHidden').findByPk(denuncia.idcomentario, { transaction: t });
        if (comentario) {
          comentario.oculto = true;
          await comentario.save({ transaction: t });
        }
      }
    }

    await t.commit();
    return res.status(200).json({
      sucesso: true,
      mensagem: 'Denúncia resolvida com sucesso.',
      denuncia,
    });
  } catch (err) {
    await t.rollback();
    console.error('Erro ao resolver denúncia:', err);
    return res.status(500).json({ mensagem: 'Erro ao resolver denúncia', erro: err.message });
  }
};

exports.minhasDenuncias = async (req, res) => {
    const id_utilizador = req.user.id || req.user.id_utilizador;

    try {
        console.log('Buscando denúncias do usuário:', id_utilizador);
        const denuncias = await Denuncia.findAll({
            where: { id_utilizador },
            include: [
                {
                    model: db.publicacao,
                    as: 'publicacao',
                    include: [
                        {
                            model: db.utilizadores,
                            as: 'autor',
                            attributes: ['id_utilizador', 'nome']
                        }
                    ],
                    required: false
                },
                {
                    model: db.comentario,
                    as: 'comentario',
                    include: [
                        {
                            model: db.utilizadores,
                            as: 'autor',
                            attributes: ['id_utilizador', 'nome']
                        }
                    ],
                    required: false
                }
            ],
            order: [['data_denuncia', 'DESC']]
        });

        return res.status(200).json({
            sucesso: true,
            denuncias
        });

    } catch (err) {
        console.error('Erro ao buscar denúncias do usuário:', err);
        return res.status(500).json({ mensagem: 'Erro ao buscar denúncias', erro: err.message });
    }
};