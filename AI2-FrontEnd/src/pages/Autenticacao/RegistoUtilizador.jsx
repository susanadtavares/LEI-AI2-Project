import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import "./AuthPages.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

export default function RegistoUtilizador() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    tipo: "",
    telemovel: "",
    data_nascimento: "",
    genero: "",
  });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSelectFocused, setIsSelectFocused] = useState(false); 
  const [isGeneroFocused, setIsGeneroFocused] = useState(false);
  const [isTipoFocused, setIsTipoFocused] = useState(false);

  const hoje = new Date().toISOString().split("T")[0];

  const formatDateInput = (value) => {
    let cleaned = value.replace(/\D/g, '');
    cleaned = cleaned.slice(0, 8);

    if (cleaned.length > 2) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 5) {
      cleaned = `${cleaned.slice(0, 5)}/${cleaned.slice(5, 9)}`;
    }

    return cleaned;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "data_nascimento") {
      newValue = formatDateInput(value);
    }

    setForm({ ...form, [name]: newValue });
  };

  const validarCampo = (nome, valor) => {
    switch (nome) {
      case "data_nascimento":
        if (!valor) return "Data de nascimento é obrigatória.";
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(valor)) return "Formato de data inválido. Use DD/MM/YYYY.";
        const [day, month, year] = valor.split('/').map(Number);
        const inputDate = new Date(year, month - 1, day);
        if (isNaN(inputDate.getTime())) return "Data inválida.";
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
    let hasSpecificError = false;
    const formDataToSend = { ...form };

    if (form.data_nascimento) {
      const [day, month, year] = form.data_nascimento.split('/').map(Number);
      formDataToSend.data_nascimento = new Date(year, month - 1, day).toISOString().split('T')[0];
    }

    Object.entries(formDataToSend).forEach(([campo, valor]) => {
      if (!valor) novosErros[campo] = "";
      const erro = validarCampo(campo, form[campo]);
      if (erro) {
        novosErros[campo] = erro;
        if (form[campo]) hasSpecificError = true;
      }
    });

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      if (Object.keys(novosErros).length > 1 || !hasSpecificError) {
        setErroGeral("Por favor, preencha todos os campos obrigatórios corretamente.");
      } else if (hasSpecificError) {
        const errorKey = Object.keys(novosErros)[0];
        setErroGeral(novosErros[errorKey]);
      }
      setLoading(false);
      return;
    }

    try {
      console.log('Dados enviados:', formDataToSend);
      const res = await api.post("/pedidos-registo", formDataToSend);
      console.log('Resposta da API:', res.data);
      setForm({
        nome: "",
        email: "",
        tipo: "",
        telemovel: "",
        data_nascimento: "",
        genero: "",
      });
      setErros({});
      setErroGeral("");
      setSuccessMessage(res.data.mensagem || "Pedido enviado com sucesso!");
    } catch (err) {
      console.error('Erro capturado:', err);
      console.log('Resposta completa:', err.response);
      const errorMessage =
        err.response?.data?.erro ||
        err.response?.data?.mensagem ||
        err.message ||
        "Erro ao enviar pedido. Tente novamente.";
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
          <p>
            Junta-te à nossa plataforma e desenvolve competências essenciais
            para o teu crescimento pessoal e profissional.
          </p>
        </div>

        <div className="formulario-registo">
          <form onSubmit={handleSubmit} noValidate>
            <h2 className="titulo-formulario-registo">Registo</h2>

            <label htmlFor="nome">Nome</label>
            <input
              name="nome"
              id="nome"
              value={form.nome}
              placeholder="Nome"
              onChange={handleChange}
            />

            <label htmlFor="email">E-mail</label>
            <input
              name="email"
              id="email"
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={handleChange}
            />

            <label htmlFor="telemovel">Telemóvel</label>
            <input
              name="telemovel"
              id="telemovel"
              type="tel"
              placeholder="Telemóvel"
              value={form.telemovel}
              onChange={handleChange}
            />

            <label htmlFor="data_nascimento">Data de Nascimento</label>
            <input
              name="data_nascimento"
              id="data_nascimento"
              type="text"
              placeholder="DD/MM/YYYY (ex.: 27/12/2023)"
              value={form.data_nascimento}
              onChange={handleChange}
            />

            <label htmlFor="genero">Género</label>
            <div className="select-container">
              <select
                name="genero"
                id="genero"
                value={form.genero}
                onChange={handleChange}
                onFocus={() => setIsGeneroFocused(true)}
                onBlur={() => setIsGeneroFocused(false)}
              >
                <option value="">Selecionar Género</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
              <span className={`select-icon ${isGeneroFocused ? 'selected' : ''}`}>
                <FontAwesomeIcon icon={faChevronDown} />
              </span>
            </div>

            <label htmlFor="tipo">Tipo de utilizador</label>
            <div className="select-container">
              <select
                name="tipo"
                id="tipo"
                value={form.tipo}
                onChange={handleChange}
                onFocus={() => setIsTipoFocused(true)}
                onBlur={() => setIsTipoFocused(false)}
              >
                <option value="">Selecionar Utilizador</option>
                <option value="formando">Formando</option>
                <option value="formador">Formador</option>
              </select>
              <span className={`select-icon ${isTipoFocused ? 'selected' : ''}`}>
                <FontAwesomeIcon icon={faChevronDown} />
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "A carregar..." : "Submeter Pedido"}
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

            <p className="link-registo">
              Já tens conta?{' '}
              <Link to="/login" className="registo-link">
                Inicia sessão aqui
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}