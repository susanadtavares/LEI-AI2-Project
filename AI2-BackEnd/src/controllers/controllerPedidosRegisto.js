const db = require("../models");
const PedidoRegisto = db.pedidos_registo;
const { sendMail } = require("./controllerEmail");
const bcrypt = require("bcrypt");

exports.criarPedido = async (req, res) => {
    try {
        let { nome, email, tipo, telemovel, data_nascimento, genero } = req.body;

        nome = nome ? nome.trim() : "";
        email = email ? email.trim().toLowerCase() : "";
        telemovel = telemovel ? telemovel.trim() : "";

        if (!nome || !/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
            return res.status(400).json({ erro: "O nome é obrigatório e só pode conter letras." });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ erro: "Email inválido." });
        }

        const tiposValidos = ["formando", "formador"];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({ erro: "Tipo de utilizador inválido." });
        }

        if (!/^9[12356]\d{7}$/.test(telemovel)) {
            return res.status(400).json({
                erro: "O número de telemóvel deve ser português e válido (ex: 912345678)."
            });
        }

        const nascimento = new Date(data_nascimento);
        if (isNaN(nascimento.getTime()) || nascimento > new Date()) {
            return res.status(400).json({ erro: "Data de nascimento inválida." });
        }

        const generosValidos = ["Masculino", "Feminino", "Outro"];
        if (!genero || !generosValidos.includes(genero)) {
            return res.status(400).json({ erro: "Género é obrigatório e deve ser válido." });
        }

        const existeEmail = await db.utilizadores.findOne({ where: { email } }) ||
            await PedidoRegisto.findOne({ where: { email } });
        if (existeEmail) {
            return res.status(400).json({ erro: "Já existe um pedido ou utilizador com este email." });
        }

        const novoPedido = await PedidoRegisto.create({ nome, email, tipo, telemovel, data_nascimento, genero });

        res.status(201).json({ mensagem: "Pedido de registo submetido com sucesso!", pedido: novoPedido });

    } catch (erro) {
        console.error("Erro ao criar pedido:", erro);
        res.status(500).json({ erro: "Erro interno ao criar o pedido." });
    }
};

exports.listarTodos = async (req, res) => {
    try {
        const pedidos = await db.pedidos_registo.findAll({
            order: [["data_pedido", "DESC"]],
        });

        res.status(200).json(pedidos);

    } catch (erro) {
        console.error("Erro ao listar todos os pedidos:", erro);
        res.status(500).json({ erro: "Erro ao listar pedidos." });
    }
};

async function listarPorEstado(estado, res) {
    try {
        const pedidos = await db.pedidos_registo.findAll({
            where: { estado },
            order: [["data_pedido", "DESC"]],
        });

        res.status(200).json(pedidos);

    } catch (erro) {
        console.error(`Erro ao listar pedidos ${estado}:`, erro);
        res.status(500).json({ erro: `Erro ao listar pedidos ${estado}.` });
    }
}

exports.listarPendentes = async (req, res) => {
    return listarPorEstado("pendente", res);
};

exports.listarAprovados = async (req, res) => {
    return listarPorEstado("aprovado", res);
};

exports.listarRejeitados = async (req, res) => {
    return listarPorEstado("rejeitado", res);
};

function gerarPasswordAPartirDoNome(nome) {
    const nomeSemEspacos = nome.replace(/\s+/g, "");
    const nomeSemAcentos = nomeSemEspacos.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const numerosAleatorios = Math.floor(1000 + Math.random() * 9000);
    return `${nomeSemAcentos}${numerosAleatorios}`;
}

async function encriptarPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function rollbackSeguro(transaction) {
    if (transaction) {
        try { await transaction.rollback(); }
        catch (err) { console.error("Erro ao fazer rollback:", err); }
    }
}

exports.aprovarPedido = async (req, res) => {
    const { id } = req.params;
    const t = await db.sequelize.transaction();

    try {
        const pedido = await db.pedidos_registo.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!pedido || pedido.estado !== "pendente") {
            await rollbackSeguro(t);
            return res.status(404).json({ erro: "Pedido não encontrado ou já tratado." });
        }

        const novaPasswordGerada = gerarPasswordAPartirDoNome(pedido.nome);
        const passwordEncriptada = await encriptarPassword(novaPasswordGerada);

        const novoUtilizador = await db.utilizadores.create({
            nome: pedido.nome,
            email: pedido.email,
            palavra_passe: passwordEncriptada,
            telemovel: pedido.telemovel,
            data_nascimento: pedido.data_nascimento,
            genero: pedido.genero,
            primeiro_login: true,
            utilizador_ativo: true
        }, { transaction: t });

        const dadosBase = {
            id_utilizador: novoUtilizador.id_utilizador,
            nome: pedido.nome,
            email: pedido.email,
            telemovel: pedido.telemovel,
            data_nascimento: pedido.data_nascimento,
            genero: pedido.genero,
            data_inscricao: new Date()
        };

        if (pedido.tipo === "formador") {
            await db.formador.create({
                ...dadosBase,
                total_formandos: 0,
                total_cursos: 0,
                descricao_formador: "",
                educacao_formador: "",
                habilidades_formador: "",
                certificacoes_formador: ""
            }, { transaction: t });
        } else {
            await db.formando.create({
                ...dadosBase,
                n_cursosacabados: 0,
                n_cursosinscritos: 0,
                descricao_formando: "",
                educacao_formando: "",
                habilidades_formando: "",
                certificacoes_formando: ""
            }, { transaction: t });
        }

        pedido.estado = "aprovado";
        pedido.data_aprovacao = new Date();
        await pedido.save({ transaction: t });

        await t.commit();

        try {
            await sendMail({
                to: pedido.email,
                subject: "Conta Aprovada com Sucesso",
                body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 30px; border-radius: 12px; border: 1px solid #eee; background-color: #fdfdfd; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); text-align: center;">
  <h2 style="color: #00c2ff; margin-bottom: 20px;">Conta Aprovada</h2>
  <p>Olá <strong>${pedido.nome}</strong>,</p>
  <p style="margin-top: 15px; line-height: 1.6;">
    O seu pedido de acesso à plataforma foi <strong>aprovado com sucesso</strong>.
  </p>
  <p style="line-height: 1.6;">
    Aqui estão os dados da sua conta:
  </p>

  <div style="background-color: #f1faff; padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 400px; text-align: left;">
    <p style="margin: 10px 0;"><strong>Nome:</strong> ${pedido.nome}</p>
    <p style="margin: 10px 0;"><strong>Email:</strong> ${pedido.email}</p>
    <p style="margin: 10px 0;"><strong>Tipo de Utilizador:</strong> ${pedido.tipo}</p>
    <p style="margin: 10px 0;"><strong>Telemóvel:</strong> ${pedido.telemovel}</p>
    <p style="margin: 10px 0;"><strong>Data de Nascimento:</strong> ${pedido.data_nascimento}</p>
    ${pedido.genero ? `<p style="margin: 10px 0;"><strong>Género:</strong> ${pedido.genero}</p>` : ""}
    <p style="margin: 10px 0;"><strong>Palavra-passe:</strong> ${novaPasswordGerada}</p>
  </div>

  <p style="color: #666;">Com os melhores cumprimentos,<br><strong>Equipa Softinsa</strong></p>
</div>
            `
            });
        } catch (erroEmail) {
            console.error("Erro ao enviar email de aprovação:", erroEmail.message);
        }

        res.status(200).json({ mensagem: "Pedido aprovado com sucesso." });

    } catch (erro) {
        await t.rollback();
        console.error("Erro ao aprovar pedido:", erro);
        res.status(500).json({ erro: "Erro ao aprovar pedido." });
    }
};


exports.rejeitarPedido = async (req, res) => {
    const { id } = req.params;
    const t = await db.sequelize.transaction();

    try {
        const pedido = await db.pedidos_registo.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!pedido || pedido.estado !== "pendente") {
            await rollbackSeguro(t);
            return res.status(404).json({ erro: "Pedido não encontrado ou já tratado." });
        }

        pedido.estado = "rejeitado";
        await pedido.save({ transaction: t });

        await t.commit();

        try {
            await sendMail({
                to: pedido.email,
                subject: "Pedido de Acesso Rejeitado",
                body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 30px; border-radius: 12px; border: 1px solid #eee; background-color: #fdfdfd; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); text-align: center;">
  <h2 style="color: #e63946; margin-bottom: 20px;">Pedido Não Aprovado</h2>
  <p style="margin: 0;">Olá <strong>${pedido.nome}</strong>,</p>
  <p style="margin-top: 15px; line-height: 1.6;">
    Após análise, informamos que o seu pedido de registo na plataforma <strong>não foi aprovado</strong>.
  </p>
  <p style="line-height: 1.6;">
    Se acha que isto foi um erro, por favor entre em contacto connosco.
  </p>
  <div style="margin: 30px 0;">
    <a href="mailto:softskills25@mail.ru"
       style="background-color: #e63946; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      Falar com Suporte
    </a>
  </div>
  <p style="color: #666;">Com os melhores cumprimentos,<br><strong>Equipa Softinsa</strong></p>
</div>
                `
            });
        } catch (erroEmail) {
            console.error("Erro ao enviar email de rejeição:", erroEmail.message);
        }

        res.status(200).json({ mensagem: "Pedido rejeitado com sucesso." });

    } catch (erro) {
        await t.rollback();
        console.error("Erro ao rejeitar pedido:", erro);
        res.status(500).json({ erro: "Erro ao rejeitar pedido." });
    }
};

