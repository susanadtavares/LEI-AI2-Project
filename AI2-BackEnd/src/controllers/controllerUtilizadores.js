const db = require('../models');
const bcrypt = require('bcrypt');
const { sendMail } = require('./controllerEmail');
const Utilizador = db.utilizadores;
const Formador = db.formador;
const Formando = db.formando;

function gerarPasswordAleatoria(nome) {
  const nomeSemEspacos = nome.replace(/\s+/g, '');
  const nomeSemAcentos = nomeSemEspacos.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const numerosAleatorios = Math.floor(1000 + Math.random() * 9000);
  return `${nomeSemAcentos}${numerosAleatorios}`;
}

async function encriptarPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

exports.createUtilizador = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    let { nome, email, tipo, telemovel, data_nascimento, genero, foto_perfil } = req.body;

    nome = nome ? nome.trim() : "";
    email = email ? email.trim().toLowerCase() : "";
    telemovel = telemovel ? telemovel.trim() : "";

    if (!nome || !/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
      return res.status(400).json({ mensagem: "O nome é obrigatório e só pode conter letras." });
    }

    const tiposValidos = ["formador", "formando"];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ mensagem: "Tipo de utilizador inválido." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ mensagem: "Email inválido." });
    }

    if (!/^9[12356]\d{7}$/.test(telemovel)) {
      return res.status(400).json({
        mensagem: "O número de telemóvel deve ser português e válido (ex: 912345678)."
      });
    }

    const nascimento = new Date(data_nascimento);
    if (isNaN(nascimento.getTime()) || nascimento > new Date()) {
      return res.status(400).json({ mensagem: "Data de nascimento inválida." });
    }

    const generosValidos = ["Masculino", "Feminino", "Outro"];
    if (genero && !generosValidos.includes(genero)) {
      return res.status(400).json({ mensagem: "Género inválido." });
    }

    const existeEmail = await Utilizador.findOne({ where: { email } });
    if (existeEmail) {
      return res.status(400).json({ mensagem: "Já existe um utilizador com este email." });
    }

    const passwordGerada = gerarPasswordAleatoria(nome);
    const passwordEncriptada = await encriptarPassword(passwordGerada);

    // Usar foto_perfil do req.body ou a foto padrão se null/undefined
    const fotoPerfilFinal = foto_perfil || 'https://res.cloudinary.com/di4up9s9u/image/upload/v1755691191/e_bkyeot.png';

    const novo = await Utilizador.create({
      nome,
      email,
      palavra_passe: passwordEncriptada,
      telemovel,
      data_nascimento,
      genero,
      primeiro_login: true,
      utilizador_ativo: true
    }, { transaction: t });

    const dadosBase = {
      id_utilizador: novo.id_utilizador,
      nome,
      email,
      telemovel,
      data_nascimento,
      genero,
      foto_perfil: fotoPerfilFinal, 
      data_inscricao: new Date(),
      [`${tipo}_ativo`]: true 
    };

    if (tipo === "formador") {
      await Formador.create({
        ...dadosBase,
        total_formandos: 0,
        total_cursos: 0,
        descricao_formador: "",
        educacao_formador: "",
        habilidades_formador: "",
        certificacoes_formador: ""
      }, { transaction: t });
    } else {
      await Formando.create({
        ...dadosBase,
        n_cursosacabados: 0,
        n_cursosinscritos: 0,
        descricao_formando: "",
        educacao_formando: "",
        habilidades_formando: "",
        certificacoes_formando: ""
      }, { transaction: t });
    }

    await t.commit();

    try {
      await sendMail({
        to: email,
        subject: "Conta Criada pelo Administrador",
        body: `
          <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <h2 style="color:#00c2ff;">Bem-vindo à Plataforma</h2>
            <p>Olá <strong>${nome}</strong>,</p>
            <p>A sua conta foi criada pelo administrador como <strong>${tipo}</strong>.</p>
            <div style="background:#eef6ff; padding:10px; border-radius:6px;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${passwordGerada}</p>
            </div>
            <p>No primeiro login, será solicitado que altere a sua password.</p>
            <p><strong>Equipa Softinsa</strong></p>
          </div>
        `
      });
    } catch (erroEmail) {
      console.error("Erro ao enviar email:", erroEmail.message);
    }

    res.status(201).json({ mensagem: "Utilizador criado com sucesso!", utilizador: novo });

  } catch (err) {
    await t.rollback();
    console.error("Erro ao criar utilizador:", err);
    res.status(500).json({ mensagem: "Erro ao criar utilizador", erro: err.message });
  }
};

exports.getUtilizadores = async (req, res) => {
  try {
    const utilizadores = await Utilizador.findAll({
      where: { utilizador_ativo: true },
    });
    res.status(200).json(utilizadores);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar utilizadores', erro: err.message });
  }
};

exports.getUtilizadorById = async (req, res) => {
  try {
    const utilizador = await Utilizador.findByPk(req.params.id);
    if (utilizador) {
      res.status(200).json(utilizador);
    } else {
      res.status(404).json({ mensagem: 'Utilizador não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar utilizador', erro: err.message });
  }
};

exports.updateUtilizador = async (req, res) => {
  try {
    let { nome, email, telemovel, data_nascimento, genero } = req.body;

    nome = nome ? nome.trim() : "";
    email = email ? email.trim().toLowerCase() : "";
    telemovel = telemovel ? telemovel.trim() : "";

    if (nome && !/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
      return res.status(400).json({ mensagem: "O nome só pode conter letras." });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ mensagem: "Email inválido." });
    }
    if (telemovel && !/^9[12356]\d{7}$/.test(telemovel)) {
      return res.status(400).json({ mensagem: "Número de telemóvel inválido." });
    }
    if (data_nascimento) {
      const nascimento = new Date(data_nascimento);
      if (isNaN(nascimento.getTime()) || nascimento > new Date()) {
        return res.status(400).json({ mensagem: "Data de nascimento inválida." });
      }
    }
    const generosValidos = ["Masculino", "Feminino", "Outro"];
    if (genero && !generosValidos.includes(genero)) {
      return res.status(400).json({ mensagem: "Género inválido." });
    }

    const utilizador = await Utilizador.findByPk(req.params.id);
    if (!utilizador) return res.status(404).json({ mensagem: "Utilizador não encontrado" });

    if (email) {
      const existeEmail = await Utilizador.findOne({ where: { email } });
      if (existeEmail && existeEmail.id_utilizador !== utilizador.id_utilizador) {
        return res.status(400).json({ mensagem: "Já existe outro utilizador com este email." });
      }
    }

    await utilizador.update(req.body);
    res.status(200).json({ mensagem: "Utilizador atualizado com sucesso", utilizador });

  } catch (err) {
    console.error("Erro ao atualizar utilizador:", err);
    res.status(500).json({ mensagem: "Erro ao atualizar utilizador", erro: err.message });
  }
};


exports.deleteUtilizador = async (req, res) => {
  try {
    const utilizador = await Utilizador.findByPk(req.params.id);
    if (!utilizador) {
      return res.status(404).json({ mensagem: 'Utilizador não encontrado' });
    }

    const formador = await Formador.findOne({ where: { id_utilizador: utilizador.id_utilizador } });
    if (formador) {
      const cursosAtivos = await db.curso.count({
        where: { id_formador: formador.id_formador, curso_ativo: true }
      });

      if (cursosAtivos > 0) {
        return res.status(400).json({
          erro: 'Não é possível desativar este formador, existem cursos ativos associados a ele.'
        });
      }
    }

    await utilizador.update({ utilizador_ativo: false });
    await Formador.update({ formador_ativo: false }, { where: { id_utilizador: utilizador.id_utilizador } });
    await Formando.update({ formando_ativo: false }, { where: { id_utilizador: utilizador.id_utilizador } });

    res.status(200).json({ mensagem: 'Utilizador e roles associadas foram desativados com sucesso' });

  } catch (err) {
    console.error('Erro ao desativar utilizador:', err);
    res.status(500).json({ mensagem: 'Erro ao desativar utilizador', erro: err.message });
  }
};


exports.updatePassword = async (req, res) => {
  const { id_utilizador } = req.params;
  const { novaPassword } = req.body;

  try {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(novaPassword)) {
      return res.status(400).json({
        mensagem: 'A password deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caracter especial.'
      });
    }

    const passwordEncriptada = await encriptarPassword(novaPassword);

    const [atualizados] = await Utilizador.update(
      { palavra_passe: passwordEncriptada, primeiro_login: false },
      { where: { id_utilizador } }
    );

    if (atualizados === 0) {
      return res.status(404).json({ mensagem: 'Utilizador não encontrado' });
    }

    await Formador.update({ palavra_passe: passwordEncriptada }, { where: { id_utilizador } });
    await Formando.update({ palavra_passe: passwordEncriptada }, { where: { id_utilizador } });
    if (db.gestor) {
      await db.gestor.update({ palavra_passe: passwordEncriptada }, { where: { id_utilizador } });
    }

    res.json({ mensagem: 'Password atualizada com sucesso em todas as tabelas e primeiro_login definido como false.' });

  } catch (err) {
    console.error('Erro ao atualizar password:', err);
    res.status(500).json({ mensagem: 'Erro ao atualizar password', erro: err.message });
  }
};



