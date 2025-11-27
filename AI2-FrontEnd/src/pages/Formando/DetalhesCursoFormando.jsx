import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import api from "../../api";
import '../Admin/OpCursos/DetalhesCursos.css';
import './DetalhesCursoFormando.css';

const DEFAULT_IMAGE_URL =
  "https://res.cloudinary.com/di4up9s9u/image/upload/v1755604007/defaultcurso_w0zceo.png";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:3000";

function unwrap(res) { return res?.data?.data ?? res?.data ?? res; }

async function resolveFormando(api, user) {
  if (!user) return null;
  if (user.id_formando) return user;

  const idUtil = user.id_utilizador ?? user.id ?? user.user_id;
  if (!idUtil) return user;

  try {
    const got = await api.get(`/formandos/por-utilizador/${idUtil}`);
    const f = unwrap(got);
    if (f?.id_formando) return { ...user, id_formando: f.id_formando };
  } catch {}

  try {
    const fr = await api.get(`/formandos`);
    const lista = unwrap(fr);
    const me = Array.isArray(lista)
      ? lista.find(x => Number(x.id_utilizador) === Number(idUtil))
      : null;
    if (me?.id_formando) return { ...user, id_formando: me.id_formando };
  } catch {}

  return user;
}

function buildThumbUrl(curso) {
  const src =
    curso?.tumbnail ||
    curso?.thumbnail ||
    curso?.imagem_url ||
    curso?.url_imagem ||
    curso?.foto_curso ||
    "";
  if (!src) return DEFAULT_IMAGE_URL;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return `${API_BASE}${src}`;
  if (src.startsWith("uploads/")) return `${API_BASE}/${src}`;
  return `${API_BASE}/uploads/${src}`;
}

function calcularEstadoCurso(inicio, fim) {
  if (!inicio || !fim) return "";
  const hoje = new Date();
  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);
  if (hoje < dataInicio) return 'Por Iniciar';
  if (hoje >= dataInicio && hoje <= dataFim) return 'Em Curso';
  return 'Terminado';
}

function formatarDatasCurta(inicio, fim) {
  const i = new Date(inicio);
  const f = new Date(fim);
  if (isNaN(i) || isNaN(f)) return "—";
  const di = i.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
  const df = f.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
  return `${di} - ${df}`;
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  return d.toLocaleDateString('pt-PT');
}

/* ---------- Regras de inscrição ---------- */
function obterDataLimiteInscricao(curso) {
  // usa campo explícito se existir; senão, assume início do curso como limite
  const raw =
    curso?.data_limite_inscricao ||
    curso?.data_limite ||
    curso?.inscricao_fim ||
    curso?.inscricoes_fim ||
    curso?.data_inicio;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

function inscricaoEncerrada(curso) {
  const limite = obterDataLimiteInscricao(curso);
  if (!limite) return false;
  const hoje = new Date();
  return hoje > limite; // passou da data-limite
}

function vagasEsgotadasFn(curso) {
  const inscritos = Number(
    curso?.membros ??
    curso?.inscritos ??
    curso?.num_inscritos ??
    0
  );
  const vagasTotais = Number(curso?.num_vagas ?? curso?.vagas ?? 0);
  return vagasTotais > 0 && inscritos >= vagasTotais;
}

export default function DetalhesCursoFormando() {
  const { id_curso } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [formando, setFormando] = useState(null);
  const [inscrito, setInscrito] = useState(false);
  const [estadoCursoAtual, setEstadoCursoAtual] = useState('');
  const [aulas, setAulas] = useState([]);
  const [testes, setTestes] = useState([]);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState({});
  const [testesSubmetidos, setTestesSubmetidos] = useState({});
  const [abaAtiva, setAbaAtiva] = useState('aulas');

  const adicionarNotificacao = (mensagem) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    const chaveNotificacoes = `notificacoes_${user.id_utilizador}`;
    const notificacoes = JSON.parse(localStorage.getItem(chaveNotificacoes)) || [];
    notificacoes.unshift({ mensagem, data: new Date().toISOString(), lida: false });
    localStorage.setItem(chaveNotificacoes, JSON.stringify(notificacoes.slice(0, 10)));
  };

  useEffect(() => {
    (async () => {
      const raw = JSON.parse(localStorage.getItem('user') || "null");
      if (!raw) return;
      const resolved = await resolveFormando(api, raw);
      setFormando(resolved);
    })();
  }, []);

  useEffect(() => {
    if (!id_curso) return;
    (async () => {
      try {
        const res = await api.get(`/cursos/${id_curso}`);
        const c = unwrap(res);
        setCurso(c);
        setEstadoCursoAtual(calcularEstadoCurso(c?.data_inicio, c?.data_fim));
      } catch (e) {
        console.error("Falha a obter curso:", e?.response?.status, e?.response?.data || e.message);
      }
    })();
  }, [id_curso]);

  useEffect(() => {
    if (!formando?.id_formando || !id_curso) return;
    (async () => {
      try {
        const res = await api.get(`/formandos/${formando.id_formando}/cursos`);
        const lista = unwrap(res) || [];
        const inscritoNoCurso = Array.isArray(lista)
          ? lista.some(c => Number(c.id_curso) === Number(id_curso))
          : false;
        setInscrito(inscritoNoCurso);
      } catch (err) {
        console.error('Erro ao verificar inscrição:', err?.response?.status, err?.response?.data || err.message);
      }
    })();
  }, [formando?.id_formando, id_curso]);

  useEffect(() => {
    if (!inscrito || !id_curso) return;
    (async () => {
      try {
        const ar = await api.get(`/aulas?curso=${id_curso}`);
        setAulas(unwrap(ar) || []);
      } catch { setAulas([]); }
      try {
        const tr = await api.get(`/testes?curso=${id_curso}`);
        setTestes(unwrap(tr) || []);
      } catch { setTestes([]); }
    })();
  }, [inscrito, id_curso]);

  const handleSubmeterResposta = async (id_teste, ficheiro) => {
    if (!formando || !ficheiro) return;
    const formData = new FormData();
    formData.append('ficheiro_resposta', ficheiro);
    formData.append('id_utilizador', formando.id_utilizador);
    formData.append('id_formando', formando.id_formando);
    formData.append('id_teste', id_teste);
    try {
      await api.post('/respostas', formData);
      setTestesSubmetidos(prev => ({ ...prev, [id_teste]: ficheiro.name }));
      const atualizado = { ...respostasSelecionadas };
      delete atualizado[id_teste];
      setRespostasSelecionadas(atualizado);
      adicionarNotificacao(`Submeteste o ficheiro "${ficheiro.name}" no teste "${id_teste}"`);
      alert('Resposta submetida com sucesso!');
    } catch (error) {
      console.error("Erro ao submeter resposta:", error?.response?.status, error?.response?.data || error.message);
      alert('Erro ao submeter resposta.');
    }
  };

  // Estado de inscrição (datas/vagas)
  const isInscricoesEncerradas = useMemo(() => curso ? inscricaoEncerrada(curso) : false, [curso]);
  const isVagasEsgotadas     = useMemo(() => curso ? vagasEsgotadasFn(curso) : false, [curso]);

  const inscreverNoCurso = async () => {
    if (!formando || !curso) return alert('Autenticação ou curso em falta.');
    if (estadoCursoAtual !== 'Por Iniciar') {
      return alert('Não é possível inscrever-se: o curso já começou ou terminou.');
    }
    if (isInscricoesEncerradas) {
      return alert('Inscrições encerradas para este curso.');
    }
    if (isVagasEsgotadas) {
      return alert('Vagas esgotadas para este curso.');
    }

    const idFormando = Number(formando.id_formando);
    const idUtilizador = Number(formando.id_utilizador ?? formando.id ?? formando.user_id);
    const idCurso = Number(curso.id_curso ?? id_curso);
    if (!idFormando || !idUtilizador || !idCurso) {
      console.error({ idFormando, idUtilizador, idCurso });
      return alert('IDs inválidos para inscrição. Verifica se o utilizador é um formando válido.');
    }

    const dataYYYYMMDD = new Date().toISOString().slice(0, 10);
    const payload = {
      id_formando: idFormando,
      id_utilizador: idUtilizador,
      id_curso: idCurso,
      estado: 'Inscrito',
      data_inscricao: dataYYYYMMDD,
    };

    try {
      await api.post('/inscricoes', payload);
      alert('Inscrição realizada com sucesso!');
      adicionarNotificacao(`Inscreveste-te no curso "${curso.titulo || curso.nome || idCurso}"`);
      setInscrito(true);
      // atualiza contagem local de membros
      setCurso((prev) => prev ? { ...prev, membros: Number(prev.membros ?? 0) + 1 } : prev);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error('Erro ao inscrever:', status, data);
      if (status === 409) {
        alert('Inscrição duplicada.');
        setInscrito(true);
      } else if (status === 400) {
        alert('Pedido inválido (400). Confirma os IDs e o formato dos campos.');
      } else {
        alert('Erro ao tentar inscrever no curso.');
      }
    }
  };

  const anularInscricao = async () => {
    if (!formando) return;
    try {
      await api.delete(`/inscricoes/${formando.id_formando}/${id_curso}`);
      alert('Inscrição anulada com sucesso!');
      adicionarNotificacao(`Anulaste a inscrição no curso "${curso?.titulo || curso?.nome || id_curso}"`);
      setInscrito(false);
      setAulas([]);
      setTestes([]);
      // libertar vaga localmente
      setCurso((prev) => prev ? { ...prev, membros: Math.max(0, Number(prev.membros ?? 0) - 1) } : prev);
    } catch (err) {
      console.error('Erro ao anular inscrição:', err?.response?.status, err?.response?.data || err.message);
      alert('Erro ao anular inscrição.');
    }
  };

  const categoriaArea = useMemo(() => {
    const categoriaNome = curso?.categoria?.nome_categoria || curso?.categoria_nome || "";
    const areaNome = curso?.area?.nome_area || curso?.area_nome || "";
    return { categoriaNome, areaNome };
  }, [curso]);

  const thumbUrl = useMemo(() => buildThumbUrl(curso), [curso]);

  if (!curso) return <div className="loading">A carregar…</div>;

  return (
    <div className="det-curso">
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          {/* Esquerda */}
          <div className="hero-left">
            <p className="crumb">
              {["Software", categoriaArea.categoriaNome, categoriaArea.areaNome, curso.titulo]
                .filter(Boolean)
                .join(" > ")}
            </p>

            <h1 className="curso-title">{curso.titulo}</h1>

            <p className="curso-tagline">
              {curso.introducao_curso ||
                "Aprender de forma prática e objetiva! Este curso ensina os conceitos essenciais com foco na aplicação."}
            </p>

            <div className="hero-actions">
              {/* Botão principal (único indicador de inscrições/vagas) */}
              {!inscrito ? (
                <button
                  className="btn primary"
                  onClick={inscreverNoCurso}
                  disabled={
                    estadoCursoAtual !== 'Por Iniciar' ||
                    isInscricoesEncerradas ||
                    isVagasEsgotadas
                  }
                  title={
                    isInscricoesEncerradas
                      ? 'Inscrições encerradas'
                      : isVagasEsgotadas
                      ? 'Vagas esgotadas'
                      : estadoCursoAtual !== 'Por Iniciar'
                      ? 'O curso já começou/terminou'
                      : 'Inscrever-me'
                  }
                >
                  {isInscricoesEncerradas
                    ? 'Inscrições encerradas'
                    : isVagasEsgotadas
                    ? 'Vagas esgotadas'
                    : 'Inscrever-me'}
                </button>
              ) : (
                <>
                  <button
                    className="btn primary"
                    onClick={() => navigate(`/formando/cursos/${curso.id_curso}/curso`)}
                  >
                    Aceder ao curso
                  </button>
                  <button className="btn ghost" onClick={anularInscricao}>
                    Anular inscrição
                  </button>
                </>
              )}

              {/* Badge de estado do curso */}
              {estadoCursoAtual && (
                <span
                  className={`estado-curso ${estadoCursoAtual.replace(/\s/g, '').toLowerCase()}`}
                  style={{ marginLeft: 8 }}
                >
                  {estadoCursoAtual}
                </span>
              )}
            </div>
          </div>

          {/* Direita: cartão resumo */}
          <aside className="hero-right">
            <div className="summary-card">
              <div className="card-cover">
                <img
                  src={thumbUrl}
                  alt={curso.titulo}
                  onError={(e) => (e.currentTarget.src = DEFAULT_IMAGE_URL)}
                />
                <div className="card-cover-title">{curso.titulo}</div>
              </div>

              <div className="card-rows">
                <div className="row">
                  <span className="mi">person</span>
                  <span className="label">FORMADOR</span>
                  <span className="value link">
                    {curso.nomeFormador || curso.nome_formador || "Sem formador"}
                  </span>
                </div>

                <div className="row">
                  <span className="mi">schedule</span>
                  <span className="label">DURAÇÃO</span>
                  <span className="value">
                    {formatarDatasCurta(curso.data_inicio, curso.data_fim)}
                  </span>
                </div>

                <div className="row">
                  <span className="mi">group</span>
                  <span className="label">VAGAS</span>
                  <span className="value">
                    {(curso.membros ?? 0)}/{curso.num_vagas ?? "—"}
                  </span>
                </div>

                <div className="row">
                  <span className="mi">grade</span>
                  <span className="label">AVALIAÇÃO</span>
                  <span className="value">
                    {curso.avaliacao ? `${curso.avaliacao}/5` : "N/A"} <span className="star">★</span>
                  </span>
                </div>
              </div>

              <div className="tipo-chip">
                {curso.tipo === "Sincrono" ? "Síncrono" : "Assíncrono"}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="content">
        <div className="container">
          <div id="sec-descricao" className="descricao-page">
            <h2>Descrição</h2>
            <p>{curso.descricao || "Sem descrição."}</p>
          </div>

          {/* Abas (apenas se inscrito) */}
          {inscrito && (
            <>
              <div className="tabs">
                <button
                  className={abaAtiva === 'aulas' ? 'active' : ''}
                  onClick={() => setAbaAtiva('aulas')}
                >
                  Aulas
                </button>
                <button
                  className={abaAtiva === 'testes' ? 'active' : ''}
                  onClick={() => setAbaAtiva('testes')}
                >
                  Testes
                </button>
              </div>

              <div className="conteudo-tab">
                {abaAtiva === 'aulas' ? (
                  <div className="secao-aulas">
                    {aulas.length === 0 ? (
                      <p>Não existem aulas disponíveis.</p>
                    ) : (
                      aulas.map((aula) => (
                        <div
                          key={aula.id_aula}
                          className="item-tab"
                          onClick={() => navigate(`/formando/aulas/${aula.id_aula}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="icon-aula">📄</div>
                          <div className="info-aula">
                            <h3>{aula.titulo_aula}</h3>
                            <p>{formatarData(aula.data)}</p>
                          </div>
                          <div className="menu-aula">⋮</div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="secao-aulas">
                    {testes.length === 0 ? (
                      <p>Não existem testes disponíveis.</p>
                    ) : (
                      testes.map((t) => (
                        <div key={t.id_teste} className="item-tab">
                          <div className="icon-aula">🧪</div>
                          <div className="info-aula">
                            <h3>{t.titulo_teste}</h3>
                            <p>{t.descricao_teste}</p>
                            {t.anexo_teste && (
                              <a
                                href={`${API_BASE}/uploads/${t.anexo_teste}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Ver PDF
                              </a>
                            )}
                          </div>
                          <div className="resposta-teste">
                            {testesSubmetidos[t.id_teste] ? (
                              <p className="mensagem-submetido">
                                ✅ <strong>Ficheiro submetido:</strong> {testesSubmetidos[t.id_teste]}
                              </p>
                            ) : !respostasSelecionadas[t.id_teste] ? (
                              <label className="upload-label">
                                <span>Selecionar ficheiro para submeter</span>
                                <input
                                  type="file"
                                  onChange={(e) =>
                                    setRespostasSelecionadas({
                                      ...respostasSelecionadas,
                                      [t.id_teste]: e.target.files[0]
                                    })
                                  }
                                />
                              </label>
                            ) : (
                              <div className="ficheiro-submetido">
                                <p><strong>Ficheiro:</strong> {respostasSelecionadas[t.id_teste].name}</p>
                                <button
                                  className="btn-submeter"
                                  onClick={() =>
                                    handleSubmeterResposta(t.id_teste, respostasSelecionadas[t.id_teste])
                                  }
                                >
                                  Submeter Resposta
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
