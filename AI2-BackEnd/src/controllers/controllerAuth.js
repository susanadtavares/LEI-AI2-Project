const jwt = require("jsonwebtoken");
const { gestor, formador, formando, utilizadores } = require('../models');
const bcrypt = require('bcrypt');

const {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenFor1stLog,
  generateTokenAccountCreation_resetpasword
} = require("../../utils/tokenutils");

async function verificarPassword(passwordInput, passwordHash) {
  return await bcrypt.compare(passwordInput, passwordHash);
}

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await utilizadores.findOne({ where: { email, utilizador_ativo: true } });
    if (!user) return res.status(403).json({ mensagem: 'Conta desativada ou não existe' });

    const passwordValida = await verificarPassword(password, user.palavra_passe);

    console.log("DEBUG:", {
      password_recebida: password,
      hash_na_bd: user.palavra_passe,
      compara: passwordValida
    });

    if (!passwordValida) return res.json({ mensagem: 'Password incorreta' });


    let tipo = null;
    let detalhesExtra = {};

    const g = await gestor.findOne({ where: { id_utilizador: user.id_utilizador } });

    const jwt_token = jwt.sign(
      {
        id: user.id_utilizador, // Mapeie id_utilizador para id
        username: user.email, // Use email como username ou outro campo
        role: tipo, // Inclua o papel explicitamente
        email: user.email,
        tipo // Mantenha tipo, se necessário
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    if (g) {
      tipo = "gestor";
      return res.json({
        id_utilizador: user.id_utilizador,
        nome: user.nome,
        email: user.email,
        tipo,
        jwt_token,
        primeiro_login: false 
      });
    }

    const fmd = await formador.findOne({ where: { id_utilizador: user.id_utilizador, formador_ativo: true } });
    if (fmd) {
      tipo = "formador";
      detalhesExtra = { id_formador: fmd.id_formador };
    }

    const fnd = await formando.findOne({ where: { id_utilizador: user.id_utilizador, formando_ativo: true } });
    if (fnd) {
      tipo = tipo || "formando";
      if (!detalhesExtra.id_formador) detalhesExtra = { id_formando: fnd.id_formando };
    }

    if (!tipo) {
      return res.status(403).json({ mensagem: 'Utilizador não possui um papel ativo' });
    }

    res.json({
      id_utilizador: user.id_utilizador,
      nome: user.nome,
      email: user.email,
      tipo,
      primeiro_login: user.primeiro_login,
      jwt_token,
      ...detalhesExtra
    });

  } catch (err) {
    res.status(500).json({ mensagem: 'Erro no login', erro: err.message });
  }
};

exports.verificarEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await utilizadores.findOne({ where: { email, utilizador_ativo: true } });
    if (!user) return res.status(403).json({ mensagem: "Conta desativada ou não existe" });

    let tipo = null;
    let detalhesExtra = {};

    if (await gestor.findOne({ where: { id_utilizador: user.id_utilizador } })) {
      tipo = "gestor";
      return res.json({
        id_utilizador: user.id_utilizador,
        nome: user.nome,
        email: user.email,
        tipo,
        primeiro_login: false
      });
    }

    const fmd = await formador.findOne({ where: { id_utilizador: user.id_utilizador, formador_ativo: true } });
    if (fmd) {
      tipo = "formador";
      detalhesExtra = { id_formador: fmd.id_formador };
    }

    const fnd = await formando.findOne({ where: { id_utilizador: user.id_utilizador, formando_ativo: true } });
    if (fnd) {
      tipo = tipo || "formando";
      if (!detalhesExtra.id_formador) detalhesExtra = { id_formando: fnd.id_formando };
    }

    if (!tipo) {
      return res.status(403).json({ mensagem: "Utilizador não possui um papel ativo" });
    }

    res.json({
      id_utilizador: user.id_utilizador,
      nome: user.nome,
      email: user.email,
      tipo,
      primeiro_login: user.primeiro_login,
      ...detalhesExtra
    });

  } catch (err) {
    res.status(500).json({ mensagem: "Erro ao verificar email", erro: err.message });
  }
};

exports.alterarPasswordPrimeiroLogin = async (req, res) => {
  const { id_utilizador } = req.params;
  const { novaPassword } = req.body;

  try {
    const user = await utilizadores.findOne({ where: { id_utilizador, utilizador_ativo: true } });
    if (!user) return res.status(404).json({ mensagem: "Utilizador não encontrado ou desativado" });

    if (!user.primeiro_login) {
      return res.status(400).json({ mensagem: "Esta conta já fez o primeiro login, alteração não permitida por esta rota" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(novaPassword)) {
      return res.status(400).json({
        mensagem: "A password deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caracter especial."
      });
    }

    const passwordEncriptada = await bcrypt.hash(novaPassword, 10);

    await utilizadores.update(
      { palavra_passe: passwordEncriptada, primeiro_login: false },
      { where: { id_utilizador } }
    );

    res.json({ mensagem: "Password alterada com sucesso! Primeiro login concluído." });

  } catch (err) {
    console.error("Erro ao alterar password no primeiro login:", err);
    res.status(500).json({ mensagem: "Erro ao alterar password no primeiro login", erro: err.message });
  }
};
