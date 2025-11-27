import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./AuthPages.css";

function TrocarPassword() {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [erroGeral, setErroGeral] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.primeiro_login) {
      navigate("/");
    }
  }, [navigate]);

  const formatDateInput = (value) => {
    return value;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "data_nascimento") {
      newValue = formatDateInput(value);
    }

    setForm((prevForm) => ({ ...prevForm, [name]: newValue }));
  };

  const validarCampo = (nome, valor) => {
    switch (nome) {
      case "password":
        if (!valor) return "Nova palavra-passe é obrigatória.";
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!passwordRegex.test(valor)) return "A palavra-passe deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.";
        return "";
      case "confirmPassword":
        if (!valor) return "Confirmação da palavra-passe é obrigatória.";
        return "";
      default:
        return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Evento de submissão disparado');
    setErroGeral("");
    setSuccessMessage("");
    setLoading(true);

    const novosErros = {};
    let emptyFields = 0;
    Object.entries(form).forEach(([campo, valor]) => {
      const erro = validarCampo(campo, valor);
      if (!valor) {
        novosErros[campo] = erro || "";
        emptyFields++;
      } else if (erro) {
        novosErros[campo] = erro;
      }
    });

    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      setErroGeral("As palavras-passe não coincidem.");
      setLoading(false);
      return;
    }

    if (emptyFields > 0) {
      setErroGeral("Por favor, preencha todos os campos obrigatórios corretamente.");
      setLoading(false);
      return;
    }

    if (Object.keys(novosErros).length > 0) {
      const errorKey = Object.keys(novosErros)[0];
      setErroGeral(novosErros[errorKey]);
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      await api.put(`/utilizadores/${user.id_utilizador}/update-password`, {
        novaPassword: form.password,
      });
      setErroGeral("");
      setSuccessMessage("Palavra-passe alterada com sucesso!");
      setTimeout(() => {
        switch (user.tipo) {
          case 'gestor':
            navigate('/gestor');
            break;
          case 'formador':
            navigate('/formador');
            break;
          case 'formando':
            navigate('/formando');
            break;
          default:
            navigate('/');
            break;
        }
      }, 1000);
    } catch (err) {
      console.error("Erro ao alterar palavra-passe:", err);
      const errorMessage =
        err.response?.data?.erro ||
        err.response?.data?.mensagem ||
        err.message ||
        "Erro ao alterar palavra-passe.";
      setErroGeral(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pagina-login">
      <div className="container-login">
        <div className="lado-texto">
          <h1>SoftSkills</h1>
          <h2>powered by Softinsa</h2>
          <p>Define uma nova palavra-passe para proteger a tua conta.</p>
        </div>

        <div className="formulario-login">
          <form onSubmit={handleSubmit}>
            <h2 className="titulo-formulario">Alterar Palavra-Passe</h2>

            <label htmlFor="password">Nova Palavra-Passe</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Coloca a nova palavra-passe"
            />

            <label htmlFor="confirmPassword">Confirmar Palavra-Passe</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirma a nova palavra-passe"
            />

            <button type="submit" disabled={loading}>
              {loading ? "A carregar..." : "Alterar"}
            </button>

            {erroGeral && (
              <p className="erro" id="erro-geral" role="alert" aria-live="polite">
                {erroGeral}
              </p>
            )}

            {successMessage && (
              <p className="sucesso" id="sucesso" role="alert" aria-live="polite">
                {successMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default TrocarPassword;
