import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api';
import './EditarFormando.css';

const DEFAULT_FOTO_URL = 'https://res.cloudinary.com/di4up9s9u/image/upload/v1755691191/e_bkyeot.png';

function formatISOtoPT(iso) {
  if (!iso) return '';
  const s = String(iso).slice(0, 10);
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return '';
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}
function parsePTtoISO(pt) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(pt || '');
  if (!m) return '';
  const [, ddStr, mmStr, yyyyStr] = m;
  const dd = Number(ddStr), mm = Number(mmStr), yyyy = Number(yyyyStr);
  const dt = new Date(yyyy, mm - 1, dd);
  if (isNaN(dt.getTime()) || dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return '';
  const today = new Date();
  const todayYMD = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const inputYMD = new Date(yyyy, mm - 1, dd);
  if (inputYMD >= todayYMD) return '';
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

async function uploadImageToBackend(file) {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (!res.data?.url) throw new Error(res.data?.error || 'Upload sem URL');
  return res.data.url;
}

export default function EditarFormando() {
  const { id_utilizador, id_formando } = useParams();
  const navigate = useNavigate();

  const [formando, setFormando] = useState({
    nome: '', email: '', telemovel: '',
    data_nascimento: '', genero: '', foto_perfil: ''
  });

  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [telemovelTocado, setTelemovelTocado] = useState(false);

  const fileInputRef = useRef(null);
  const [novaFotoFile, setNovaFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [originalFotoUrl, setOriginalFotoUrl] = useState('');
  const [forcarDefaultNoSubmit, setForcarDefaultNoSubmit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [erroFoto, setErroFoto] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/formandos/${id_utilizador}/${id_formando}/full`);
        const d = res.data || {};
        const mapped = {
          nome: d.nome || '',
          email: d.email || '',
          telemovel: d.telemovel == null ? '' : String(d.telemovel),
          genero: d.genero || '',
          data_nascimento: formatISOtoPT(d.data_nascimento),
          foto_perfil: d.foto_perfil || ''
        };
        setFormando(mapped);
        setOriginalFotoUrl(mapped.foto_perfil || '');
        setFotoPreview(mapped.foto_perfil || '');
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        alert('Erro ao carregar dados do formando.');
      }
    })();
  }, [id_utilizador, id_formando]);

  const validarCampo = (nome, valor) => {
    switch (nome) {
      case 'nome':
        return /^[A-Za-zÀ-ÿ\s]+$/.test(valor) ? '' : 'O nome deve conter apenas letras.';
      case 'telemovel':
        if (!/^\d*$/.test(valor)) return 'O telemóvel só pode conter dígitos.';
        if (valor.length !== 9) return 'O telemóvel deve ter exatamente 9 dígitos.';
        if (!/^9[12356]\d{7}$/.test(valor)) return 'O telemóvel não é válido em Portugal.';
        return '';
      case 'data_nascimento': {
        if (!valor) return 'Data de nascimento é obrigatória.';
        const re = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!re.test(valor)) return 'Formato de data inválido. Use DD/MM/YYYY.';
        const iso = parsePTtoISO(valor);
        if (!iso) return 'Data inválida (não pode ser hoje ou futura).';
        return '';
      }
      case 'email':
        if (!valor) return 'O email é obrigatório.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return 'Email inválido.';
        return '';
      case 'genero':
        if (!valor) return 'O género é obrigatório.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let next = value;
    if (name === 'data_nascimento') {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      if (digits.length <= 2) next = digits;
      else if (digits.length <= 4) next = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      else next = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    setFormando(prev => ({ ...prev, [name]: name === 'data_nascimento' ? next : value }));
    if (name === 'telemovel' && !telemovelTocado) setTelemovelTocado(true);

    const erro = validarCampo(name, name === 'data_nascimento' ? next : value);
    setErros(prev => ({ ...prev, [name]: erro }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErroFoto('Ficheiro inválido. Escolha uma imagem.'); return; }
    if (file.size > 5 * 1024 * 1024) { setErroFoto('Imagem demasiado grande (máx. 5 MB).'); return; }
    setErroFoto('');
    setNovaFotoFile(file);
    setForcarDefaultNoSubmit(false);
    setFotoPreview(URL.createObjectURL(file));
  };

  const isDefault = (url) => !!url && url === DEFAULT_FOTO_URL;

  const removerFoto = () => {
    if (isDefault(fotoPreview) && !novaFotoFile) return;
    setNovaFotoFile(null);
    setErroFoto('');
    setForcarDefaultNoSubmit(true);
    setFotoPreview(DEFAULT_FOTO_URL);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroGeral('');
    setErros({});
    const { nome, email, telemovel, data_nascimento, genero } = formando;

    if (!nome || !email || !telemovel || !data_nascimento || !genero) {
      setErroGeral('Todos os campos devem ser preenchidos (exceto a foto).');
      return;
    }

    const novosErros = {};
    ['nome', 'email', 'telemovel', 'data_nascimento', 'genero'].forEach((campo) => {
      const erro = validarCampo(campo, formando[campo]);
      if (erro) novosErros[campo] = erro;
    });

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      document.querySelector(`[name="${Object.keys(novosErros)[0]}"]`)?.focus();
      return;
    }

    const isoData = parsePTtoISO(data_nascimento);
    if (!isoData) {
      setErros({ data_nascimento: 'Data inválida (não pode ser hoje ou futura).' });
      return;
    }

    try {
      setUploading(true);
      let fotoURL = originalFotoUrl || '';
      if (novaFotoFile) fotoURL = await uploadImageToBackend(novaFotoFile);
      else if (forcarDefaultNoSubmit) fotoURL = DEFAULT_FOTO_URL;

      await api.put(`/formandos/${id_utilizador}/${id_formando}/full`, {
        foto_perfil: fotoURL, nome, email, telemovel, genero, data_nascimento: isoData
      });

      setUploading(false);
      navigate('/gestor/formandos');
    } catch (err) {
      setUploading(false);
      const msg = err.response?.data?.error || err.response?.data?.mensagem || err.message || 'Erro ao atualizar formando.';
      setErroGeral(msg);
    }
  };

  const disableRemover =
    (isDefault(fotoPreview) && !novaFotoFile) || (!fotoPreview && !originalFotoUrl);

  return (
    <div className="ef-page">
      <div className="editar-formando-ui">
        <h2><span className="ef-title">Editar Formando</span></h2>

        <form onSubmit={handleSubmit}>
          <div className="ef-form-grid">
            {/* Coluna da foto */}
            <aside className="ef-photo-col">
              <div className="ef-foto-preview">
                <div
                  className="ef-avatar-click"
                  onClick={() => fileInputRef.current?.click()}
                  title="Clique para escolher uma foto"
                >
                  {fotoPreview ? <img src={fotoPreview} alt="Foto de perfil" /> : <div className="ef-circle">Foto</div>}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} hidden />

                <div className="ef-foto-actions">
                  <button type="button" className="ef-btn ef-btn-primary" onClick={() => fileInputRef.current?.click()}>
                    {fotoPreview ? 'Trocar foto' : 'Escolher foto'}
                  </button>
                  <button
                    type="button"
                    className="ef-btn ef-btn-danger-outline"
                    onClick={removerFoto}
                    disabled={disableRemover}
                    title={disableRemover ? 'A foto default não pode ser removida' : 'Remover foto (volta à default)'}
                  >
                    Remover foto
                  </button>
                </div>

                {erroFoto && <span className="ef-msg-erro">{erroFoto}</span>}
                {uploading && <span style={{ fontSize: '.9rem' }}>A enviar imagem…</span>}
              </div>
            </aside>

            {/* Coluna dos campos */}
            <section className="ef-fields-col">
              <div className="ef-form-row ef-name-row">
                <div className="ef-form-group">
                  <label>Nome</label>
                  <input
                    name="nome"
                    placeholder="Nome"
                    value={formando.nome}
                    onChange={handleChange}
                    required
                    className={erros.nome ? 'ef-erro-input' : ''}
                  />
                  {erros.nome && <span className="ef-msg-erro">{erros.nome}</span>}
                </div>
              </div>

              <div className="ef-form-row">
                <div className="ef-form-group">
                  <label>E-mail</label>
                  <input
                    name="email"
                    type="email"
                    value={formando.email}
                    onChange={handleChange}
                    required
                    className={erros.email ? 'ef-erro-input' : ''}
                  />
                  {erros.email && <span className="ef-msg-erro">{erros.email}</span>}
                </div>
                <div className="ef-form-group">
                  <label>Telemóvel</label>
                  <input
                    name="telemovel"
                    placeholder="Telemóvel"
                    value={formando.telemovel}
                    onChange={handleChange}
                    required
                    className={telemovelTocado && erros.telemovel ? 'ef-erro-input' : ''}
                    maxLength={9}
                    inputMode="numeric"
                  />
                  {telemovelTocado && erros.telemovel && <span className="ef-msg-erro">{erros.telemovel}</span>}
                </div>
              </div>

              <div className="ef-form-row">
                <div className="ef-form-group">
                  <label>Data de Nascimento</label>
                  <input
                    name="data_nascimento"
                    type="text"
                    placeholder="DD/MM/YYYY (ex.: 27/12/1990)"
                    value={formando.data_nascimento}
                    onChange={handleChange}
                    required
                    className={erros.data_nascimento ? 'ef-erro-input' : ''}
                    inputMode="numeric"
                  />
                  {erros.data_nascimento && <span className="ef-msg-erro">{erros.data_nascimento}</span>}
                </div>
                <div className="ef-form-group">
                  <label>Género</label>
                  <select
                    name="genero"
                    value={formando.genero}
                    onChange={handleChange}
                    required
                    className={erros.genero ? 'ef-erro-input' : ''}
                  >
                    <option value="">Género</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                  {erros.genero && <span className="ef-msg-erro">{erros.genero}</span>}
                </div>
              </div>

              {erroGeral && (
                <p className="ef-msg-erro" role="alert" aria-live="polite">
                  {erroGeral}
                </p>
              )}

              {/* AÇÕES: descem e alinham com a área da foto */}
              <div className="ef-actions-row">
                <div className="ef-form-buttons">
                  <button
                    type="button"
                    className="ef-action-btn ef-action-btn--ghost"
                    onClick={() => navigate('/gestor/formandos')}
                    disabled={uploading}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="ef-action-btn ef-action-btn--primary" disabled={uploading}>
                    {uploading ? 'A carregar...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}
