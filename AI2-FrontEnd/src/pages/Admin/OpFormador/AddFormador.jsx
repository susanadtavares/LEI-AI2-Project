import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import './AddFormador.css';

export default function AdicionarFormador() {
  const [formador, setFormador] = useState({
    nome_proprio: '',
    apelido: '',
    email: '',
    telemovel: '',
    data_nascimento: '',
    genero: ''
  });

  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatDateInput = (raw) => {
    let v = raw.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) return v.replace(/(\d{2})(\d{2})(\d{0,4}).*/, '$1/$2/$3');
    if (v.length >= 3) return v.replace(/(\d{2})(\d{0,2}).*/, '$1/$2');
    return v;
  };

  const ddmmyyyyToISO = (s) => {
    const [d, m, y] = s.split('/').map((x) => x.padStart(2, '0'));
    return `${y}-${m}-${d}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'data_nascimento') {
      setFormador((f) => ({ ...f, data_nascimento: formatDateInput(value) }));
    } else {
      setFormador((f) => ({ ...f, [name]: value }));
    }
  };

  const validarCampo = (nome, v) => {
    const valor = typeof v === 'string' ? v.trim() : v;

    switch (nome) {
      case 'nome_proprio':
      case 'apelido':
        if (!valor) return 'Este campo é obrigatório.';
        if (!/^[A-Za-zÀ-ÿ\s]+$/.test(valor)) return 'Deve conter apenas letras.';
        return '';
      case 'email':
        if (!valor) return 'O email é obrigatório.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return 'Email inválido.';
        return '';
      case 'telemovel':
        if (!valor) return 'O telemóvel é obrigatório.';
        if (!/^\d{9}$/.test(valor)) return 'O telemóvel deve ter exatamente 9 dígitos.';
        if (!/^9[12356]\d{7}$/.test(valor)) return 'O telemóvel não é válido em Portugal.';
        return '';
      case 'data_nascimento': {
        if (!valor) return 'A data de nascimento é obrigatória.';
        const re = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!re.test(valor)) return 'Formato de data inválido. Use DD/MM/AAAA.';
        const [day, month, year] = valor.split('/').map(Number);
        const d = new Date(year, month - 1, day);
        const dataValida = d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
        if (!dataValida) return 'Data inválida.';
        const hojeISO = new Date().toISOString().split('T')[0];
        const iso = ddmmyyyyToISO(valor);
        if (iso >= hojeISO) return 'A data de nascimento não pode ser hoje nem futura.';
        return '';
      }
      case 'genero': {
        if (!valor) return 'O género é obrigatório.';
        const generosValidos = ['Masculino', 'Feminino', 'Outro'];
        if (!generosValidos.includes(valor)) return 'Género inválido.';
        return '';
      }
      default:
        return '';
    }
  };

  const ORDEM_CAMPOS = [
    'nome_proprio',
    'apelido',
    'email',
    'telemovel',
    'data_nascimento',
    'genero',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroGeral('');
    setErros({});
    setLoading(true);

    const formDataToSend = { ...formador };
    if (formador.data_nascimento) {
      formDataToSend.data_nascimento = ddmmyyyyToISO(formador.data_nascimento);
    }

    const novosErros = {};
    ORDEM_CAMPOS.forEach((campo) => {
      const erro = validarCampo(campo, formador[campo]);
      if (erro) novosErros[campo] = erro;
    });

    const camposComErro = ORDEM_CAMPOS.filter((c) => novosErros[c]);
    if (camposComErro.length > 0) {
      setErros(novosErros);
      setErroGeral(
        camposComErro.length > 1
          ? 'Por favor, preencha todos os campos obrigatórios corretamente.'
          : ''
      );
      document.querySelector(`[name="${camposComErro[0]}"]`)?.focus();
      setLoading(false);
      return;
    }

    const nome = `${formador.nome_proprio.trim()} ${formador.apelido.trim()}`.trim();

    try {
      const novoUtilizador = {
        nome,
        email: formador.email.trim(),
        telemovel: formador.telemovel.trim(),
        data_nascimento: formDataToSend.data_nascimento,
        genero: formador.genero,
        tipo: 'formador'
      };

      await api.post('/utilizadores', novoUtilizador);

      alert('Formador criado com sucesso!');
      navigate('/gestor/formadores');
    } catch (err) {
      console.error('Erro ao adicionar formador:', err);
      if (err.response && err.response.data?.mensagem) {
        setErroGeral(err.response.data.mensagem);
      } else {
        setErroGeral('Erro ao adicionar formador.');
      }
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensagensCampo = Object.keys(erros).length === 1;

  return (
    <div className="formador-add-page">
      <div className="formador-add">
        <h2>
          <span className="formador-add__heading">Adicionar Formador</span>
        </h2>

        <form onSubmit={handleSubmit} noValidate className="formador-add__card">
          <div className="formador-add__row">
            <div className="formador-add__group">
              <label>
                Nome Próprio <span className="formador-add__req">*</span>
              </label>
              <input
                name="nome_proprio"
                value={formador.nome_proprio}
                placeholder="Nome Próprio"
                onChange={handleChange}
                className={erros.nome_proprio ? 'formador-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.nome_proprio && (
                <span className="formador-add__msg-erro">{erros.nome_proprio}</span>
              )}
            </div>

            <div className="formador-add__group">
              <label>
                Apelido <span className="formador-add__req">*</span>
              </label>
              <input
                name="apelido"
                value={formador.apelido}
                placeholder="Apelido"
                onChange={handleChange}
                className={erros.apelido ? 'formador-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.apelido && (
                <span className="formador-add__msg-erro">{erros.apelido}</span>
              )}
            </div>
          </div>

          <div className="formador-add__row">
            <div className="formador-add__group">
              <label>
                E-mail <span className="formador-add__req">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={formador.email}
                placeholder="E-mail"
                onChange={handleChange}
                className={erros.email ? 'formador-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.email && (
                <span className="formador-add__msg-erro">{erros.email}</span>
              )}
            </div>

            <div className="formador-add__group">
              <label>
                Telemóvel <span className="formador-add__req">*</span>
              </label>
              <input
                name="telemovel"
                type="tel"
                inputMode="numeric"
                maxLength={9}
                placeholder="Telemóvel"
                value={formador.telemovel}
                onChange={handleChange}
                className={erros.telemovel ? 'formador-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.telemovel && (
                <span className="formador-add__msg-erro">{erros.telemovel}</span>
              )}
            </div>
          </div>

          <div className="formador-add__row">
            <div className="formador-add__group">
              <label htmlFor="data_nascimento">
                Data de Nascimento <span className="formador-add__req">*</span>
              </label>
              <input
                name="data_nascimento"
                id="data_nascimento"
                type="text"
                maxLength={10}
                placeholder="DD/MM/AAAA"
                value={formador.data_nascimento}
                onChange={handleChange}
                className={erros.data_nascimento ? 'formador-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.data_nascimento && (
                <span className="formador-add__msg-erro">{erros.data_nascimento}</span>
              )}
            </div>

            <div className="formador-add__group">
              <label>
                Género <span className="formador-add__req">*</span>
              </label>
              <select
                name="genero"
                value={formador.genero}
                onChange={handleChange}
                className={erros.genero ? 'formador-add__erro-input' : ''}
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
              {mostrarMensagensCampo && erros.genero && (
                <span className="formador-add__msg-erro">{erros.genero}</span>
              )}
            </div>
          </div>

          {erroGeral && (
            <p className="formador-add__msg-erro" role="alert" aria-live="polite">
              {erroGeral}
            </p>
          )}

          <div className="formador-add__actions">
            <button
              type="button"
              className="formador-add__btn formador-add__btn--ghost"
              onClick={() => navigate('/gestor/formadores')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="formador-add__btn formador-add__btn--primary"
              disabled={loading}
            >
              {loading ? 'A carregar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
