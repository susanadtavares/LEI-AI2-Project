import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "./DetalhesCursos.css";
import api from "../../../api";
import logotipo from "../../../assets/logotipo.png";

const DEFAULT_IMAGE_URL =
  "https://res.cloudinary.com/di4up9s9u/image/upload/v1755604007/defaultcurso_w0zceo.png";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:3001";

  // caminho do logo (public/… ou uma URL externa)
const BRAND_LOGO = logotipo;

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

function formatarDatasCurta(inicio, fim) {
  const i = new Date(inicio);
  const f = new Date(fim);
  if (isNaN(i) || isNaN(f)) return "—";
  const di = i.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
  const df = f.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
  return `${di} - ${df}`;
}

export default function DetalhesCurso() {
  const { id_curso } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarMembros, setMostrarMembros] = useState(false);
  const [membros, setMembros] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    api
      .get(`/cursos/${id_curso}`)
      .then((res) => setCurso(res?.data?.data ?? res.data))
      .catch((e) => console.error("Erro ao carregar curso:", e));
  }, [id_curso]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const carregarMembros = async () => {
    try {
      const res = await api.get(`/cursos/${id_curso}/membros`);
      const payload = res?.data ?? {};
      setMembros({ formador: payload.formador, lista: payload.membros || [] });
      setMostrarMembros(true);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar membros do curso.");
    }
  };

  const confirmarEliminacao = async (id) => {
    if (!window.confirm("Tens a certeza que queres eliminar este curso?")) return;
    try {
      await api.delete(`/cursos/${id}`);
      alert("Curso eliminado com sucesso!");
      navigate("/gestor/cursos");
    } catch {
      alert("Erro ao eliminar curso.");
    }
  };

  const { categoriaNome, areaNome } = useMemo(() => {
    const categoriaNome =
      curso?.categoria?.nome_categoria || curso?.categoria_nome || "";
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
          <div className="hero-left">
            <p className="crumb">
              {["Software", categoriaNome, areaNome, curso.titulo]
                .filter(Boolean)
                .join(" > ")}
            </p>

            <h1 className="curso-title">{curso.titulo}</h1>
            <p className="curso-tagline">
              {curso.introducao_curso ||
                "Aprender de forma prática e objetiva! Este curso ensina os conceitos essenciais com foco na aplicação."}
            </p>

            <div className="hero-actions">
              <button
                className="btn primary"
                onClick={() => {
                  const user = JSON.parse(localStorage.getItem('user'));
                  const role = (user?.tipo || 'gestor').toLowerCase(); // 'gestor' | 'formador' | 'formando'
                  navigate(`/${role}/cursos/${curso.id_curso}/curso`);
                }}
              >
                Aceder ao curso
              </button>
              <button className="btn ghost" onClick={carregarMembros}>
                Membros
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  const el = document.getElementById("sec-descricao");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Avaliações
              </button>

              <div className="menu" ref={menuRef}>
                <button
                  className="btn icon"
                  aria-label="Mais opções"
                  onClick={() => setMenuAberto((v) => !v)}
                >
                  ⋯
                </button>
                {menuAberto && (
                  <div className="menu-pop">
                    <button onClick={() => navigate(`/gestor/cursos/editar/${curso.id_curso}`)}>
                      Editar
                    </button>
                    <button onClick={() => confirmarEliminacao(curso.id_curso)}>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD à direita (sobrepõe o conteúdo) */}
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
                    {curso.nomeFormador || "Sem formador"}
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
                    {curso.avaliacao ? `${curso.avaliacao}/5` : "N/A"}{" "}
                    <span className="star">★</span>
                  </span>
                </div>
              </div>

              <div className="tipo-chip">
                {curso.tipo === "Sincrono" ? "Síncrono" : "Assíncrono"}
              </div>
            </div>

            <div className="brand">
              <img
                className="brand-logo"
                src={BRAND_LOGO}
                alt="SOFTINSA"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
              />
            </div>
          </aside>
        </div>
      </section>

      {/* CONTEÚDO EM FUNDO BRANCO */}
      <section className="content">
        <div className="container">
          <div id="sec-descricao" className="descricao-page">
            <h2>Descrição</h2>
            <p>{curso.descricao || "Sem descrição."}</p>
          </div>

          {mostrarMembros && membros && (
            <div className="membros-page">
              <h2>Membros do Curso</h2>
              <p>
                <strong>Formador:</strong> {membros.formador?.nome || "Sem formador"}
              </p>
              <h3>Formandos</h3>
              {membros.lista.length ? (
                <ul>
                  {membros.lista.map((f) => (
                    <li key={f.id_formando}>
                      {f.nome} — <span className="muted">{f.email}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhum formando inscrito.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
