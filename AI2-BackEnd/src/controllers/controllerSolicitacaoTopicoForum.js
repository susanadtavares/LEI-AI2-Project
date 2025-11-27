const db = require("../models");
const SolicitacaoTopicoForum = db.solicitacao_topico_forum;
const TopicoForum = db.topico_forum;
const Area = db.area;
const Utilizadores = db.utilizadores;
exports.criarSolicitacao = async (req, res) => {
    try {
        const { titulo, descricao, id_utilizador, id_area } = req.body;

        if (!titulo || !descricao || !id_utilizador || !id_area) {
            return res.status(400).json({ message: "Preencha todos os campos, incluindo a área" });
        }

        const area = await Area.findOne({ where: { id_area, area_ativa: true } });
        if (!area) {
            return res.status(400).json({ message: "Área inválida ou inativa" });
        }

        const novaSolicitacao = await SolicitacaoTopicoForum.create({
            titulo,
            descricao,
            id_utilizador,
            id_area,
            estado: "pendente",
            data_solicitacao: new Date()
        });

        res.status(201).json(novaSolicitacao);
    } catch (error) {
        console.error("Erro ao criar solicitação:", error);
        res.status(500).json({ message: "Erro ao criar solicitação" });
    }
};

exports.listarSolicitacoes = async (req, res) => {
    try {
        const { estado } = req.query;
        const where = {};
        if (estado) where.estado = estado;

        const solicitacoes = await SolicitacaoTopicoForum.findAll({
            where,
            include: [
                {
                    model: Utilizadores,
                    as: 'utilizador',
                    attributes: ['id_utilizador', 'nome']
                },
                {
                    model: Area,
                    as: 'area',
                    attributes: ['id_area', 'nome_area', 'area_ativa']
                }
            ],
            order: [['data_solicitacao', 'DESC']]
        });

        res.status(200).json(solicitacoes);
    } catch (error) {
        console.error("Erro ao listar solicitações:", error);
        res.status(500).json({
            message: "Erro ao listar solicitações",
            detalhe: error.message
        });
    }
};

exports.atualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const solicitacao = await SolicitacaoTopicoForum.findByPk(id, {
            include: [{ model: Area, as: "area" }]
        });

        if (!solicitacao) {
            return res.status(404).json({ message: "Solicitação não encontrada" });
        }

        solicitacao.estado = estado;
        await solicitacao.save();

        if (estado === "aceite") {
            if (!solicitacao.area || !solicitacao.area.area_ativa) {
                return res.status(400).json({ message: "Não é possível aceitar. A área está inativa ou não existe." });
            }

            await TopicoForum.create({
                titulo_topico: solicitacao.titulo,
                descricao_topico: solicitacao.descricao,
                id_utilizador: solicitacao.id_utilizador,
                id_area: solicitacao.id_area,
                data_criacao: new Date()
            });
        }

        res.status(200).json({ message: "Estado atualizado com sucesso", solicitacao });
    } catch (error) {
        console.error("Erro ao atualizar estado:", error);
        res.status(500).json({ message: "Erro ao atualizar estado" });
    }
};

