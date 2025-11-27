import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import './AddFormando.css';

export default function AdicionarFormando() {
  const [formando, setFormando] = useState({
    nome_proprio: '',
    apelido: '',
    email: '',
    telemovel: '',
    data_nascimento: '',
    genero: '',
    descricao_formando: '',
    educacao_formando: '',
    habilidades_formando: '',
    certificacoes_formando: '',
    n_cursosacabados: 0,
    n_cursosinscritos: 0,
    data_inscricao: new Date().toISOString(),
    foto_perfil: ''
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
      setFormando((f) => ({ ...f, data_nascimento: formatDateInput(value) }));
    } else {
      setFormando((f) => ({ ...f, [name]: value }));
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
        const dataValida =
          d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
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

    const formDataToSend = { ...formando };
    if (formando.data_nascimento) {
      formDataToSend.data_nascimento = ddmmyyyyToISO(formando.data_nascimento);
    }

    const novosErros = {};
    ORDEM_CAMPOS.forEach((campo) => {
      const erro = validarCampo(campo, formando[campo]);
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

    const nome = `${formando.nome_proprio.trim()} ${formando.apelido.trim()}`.trim();

    try {
      const novoUtilizador = {
        nome,
        email: formando.email.trim(),
        telemovel: formando.telemovel.trim(),
        data_nascimento: formDataToSend.data_nascimento,
        genero: formando.genero,
        tipo: 'formando',
        descricao_formando: formando.descricao_formando.trim(),
        educacao_formando: formando.educacao_formando.trim(),
        habilidades_formando: formando.habilidades_formando.trim(),
        certificacoes_formando: formando.certificacoes_formando.trim(),
        n_cursosacabados: formando.n_cursosacabados,
        n_cursosinscritos: formando.n_cursosinscritos,
        data_inscricao: formando.data_inscricao,
        foto_perfil: formando.foto_perfil.trim()
      };

      await api.post('/utilizadores', novoUtilizador);

      alert('Formando criado com sucesso!');
      navigate('/gestor/formandos');
    } catch (err) {
      console.error('Erro ao adicionar formando:', err);
      if (err.response && err.response.data?.mensagem) {
        setErroGeral(err.response.data.mensagem);
      } else {
        setErroGeral('Erro ao adicionar formando.');
      }
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensagensCampo = Object.keys(erros).length === 1;

  return (
    <div className="formando-add-page">
      <div className="formando-add">
        <h2>
          <span className="formando-add__heading">Adicionar Formando</span>
        </h2>

        <form onSubmit={handleSubmit} noValidate className="formando-add__card">
          <div className="formando-add__row">
            <div className="formando-add__group">
              <label>
                Nome Próprio <span className="formando-add__req">*</span>
              </label>
              <input
                name="nome_proprio"
                value={formando.nome_proprio}
                placeholder="Nome Próprio"
                onChange={handleChange}
                className={erros.nome_proprio ? 'formando-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.nome_proprio && (
                <span className="formando-add__msg-erro">{erros.nome_proprio}</span>
              )}
            </div>

            <div className="formando-add__group">
              <label>
                Apelido <span className="formando-add__req">*</span>
              </label>
              <input
                name="apelido"
                value={formando.apelido}
                placeholder="Apelido"
                onChange={handleChange}
                className={erros.apelido ? 'formando-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.apelido && (
                <span className="formando-add__msg-erro">{erros.apelido}</span>
              )}
            </div>
          </div>

          <div className="formando-add__row">
            <div className="formando-add__group">
              <label>
                E-mail <span className="formando-add__req">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={formando.email}
                placeholder="E-mail"
                onChange={handleChange}
                className={erros.email ? 'formando-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.email && (
                <span className="formando-add__msg-erro">{erros.email}</span>
              )}
            </div>

            <div className="formando-add__group">
              <label>
                Telemóvel <span className="formando-add__req">*</span>
              </label>
              <input
                name="telemovel"
                type="tel"
                inputMode="numeric"
                maxLength={9}
                placeholder="Telemóvel"
                value={formando.telemovel}
                onChange={handleChange}
                className={erros.telemovel ? 'formando-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.telemovel && (
                <span className="formando-add__msg-erro">{erros.telemovel}</span>
              )}
            </div>
          </div>

          <div className="formando-add__row">
            <div className="formando-add__group">
              <label htmlFor="data_nascimento">
                Data de Nascimento <span className="formando-add__req">*</span>
              </label>
              <input
                name="data_nascimento"
                id="data_nascimento"
                type="text"
                maxLength={10}
                placeholder="DD/MM/AAAA"
                value={formando.data_nascimento}
                onChange={handleChange}
                className={erros.data_nascimento ? 'formando-add__erro-input' : ''}
              />
              {mostrarMensagensCampo && erros.data_nascimento && (
                <span className="formando-add__msg-erro">{erros.data_nascimento}</span>
              )}
            </div>

            <div className="formando-add__group">
              <label>
                Género <span className="formando-add__req">*</span>
              </label>
              <select
                name="genero"
                value={formando.genero}
                onChange={handleChange}
                className={erros.genero ? 'formando-add__erro-input' : ''}
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
              {mostrarMensagensCampo && erros.genero && (
                <span className="formando-add__msg-erro">{erros.genero}</span>
              )}
            </div>
          </div>

          {erroGeral && (
            <p className="formando-add__msg-erro" role="alert" aria-live="polite">
              {erroGeral}
            </p>
          )}

          <div className="formando-add__actions">
            <button
              type="button"
              className="formando-add__btn formando-add__btn--ghost"
              onClick={() => navigate('/gestor/formandos')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="formando-add__btn formando-add__btn--primary"
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
