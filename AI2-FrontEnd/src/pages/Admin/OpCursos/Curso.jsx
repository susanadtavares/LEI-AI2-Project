import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../../../api";
import "./Curso.css";
import NovoTesteModal from "./NovoTesteModal"; // ✅ mesmo diretório

const DEFAULT_IMAGE_URL =
  "https://res.cloudinary.com/di4up9s9u/image/upload/v1755604007/defaultcurso_w0zceo.png";

export default function Curso() {
  const { id_curso } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [aulas, setAulas] = useState([]);
  const [testes, setTestes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("aulas");
  const [tipoUtilizador, setTipoUtilizador] = useState(null);
  const [showNovoTeste, setShowNovoTeste] = useState(false);

  // Carrega o utilizador
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.tipo) setTipoUtilizador(user.tipo);
  }, []);

  // Helpers
  const isGestorOuFormador = useMemo(
    () => ["gestor", "formador"].includes(tipoUtilizador),
    [tipoUtilizador]
  );
  const isFormando = tipoUtilizador === "formando";

  const bannerUrl = useMemo(() => {
    const src =
      curso?.tumbnail ||
      curso?.thumbnail ||
      curso?.imagem_url ||
      curso?.url_imagem ||
      curso?.foto_curso ||
      "";
    if (!src) return DEFAULT_IMAGE_URL;
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith("/")) return `${import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || "http://localhost:3001"}${src}`;
    if (src.startsWith("uploads/")) return `${import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || "http://localhost:3001"}/${src}`;
    return `${import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || "http://localhost:3001"}/uploads/${src}`;
  }, [curso]);

  // Carrega dados do curso e conteúdos
  useEffect(() => {
    if (!id_curso) return;

    api
      .get(`/cursos/${id_curso}`)
      .then((res) => setCurso(res?.data?.data ?? res.data))
      .catch((e) => console.error("Erro ao carregar curso:", e));

    api
      .get(`/cursos/${id_curso}/aulas`)
      .then((res) => setAulas(res?.data?.data ?? res.data ?? []))
      .catch(() =>
        api
          .get(`/aulas?curso=${id_curso}`)
          .then((res) => setAulas(res?.data?.data ?? res.data ?? []))
          .catch((e) => console.error("Erro ao carregar aulas:", e))
      );

    api
      .get(`/cursos/${id_curso}/testes`)
      .then((res) => setTestes(res?.data?.data ?? res.data ?? []))
      .catch(() =>
        api
          .get(`/testes?curso=${id_curso}`)
          .then((res) => setTestes(res?.data?.data ?? res.data ?? []))
          .catch((e) => console.error("Erro ao carregar testes:", e))
      );

    api
      .get(`/cursos/${id_curso}/quizzes`)
      .then((res) => setQuizzes(res?.data?.data ?? res.data ?? []))
      .catch(() =>
        api
          .get(`/quizzes?curso=${id_curso}`)
          .then((res) => setQuizzes(res?.data?.data ?? res.data ?? []))
          .catch(() => setQuizzes([]))
      );
  }, [id_curso]);

  // Submissão de resposta (formando)
  const handleSubmeterResposta = async (id_teste, ficheiro) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id_utilizador || !ficheiro) return;

    const formData = new FormData();
    formData.append("ficheiro_resposta", ficheiro);
    formData.append("id_utilizador", user.id_utilizador);
    formData.append("id_teste", id_teste);

    try {
      await api.post("/respostas", formData);
      alert("Resposta submetida com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao submeter resposta.");
    }
  };

  // Abas dinâmicas
  const abas = useMemo(() => {
    const base = [
      { key: "aulas", label: "Aulas" },
      { key: "testes", label: "Testes" },
    ];
    if ((curso?.tipo === "Assincrono" || curso?.tipo === "Assíncrono") && quizzes?.length) {
      base.splice(1, 0, { key: "quizzes", label: "Quizzes" });
    }
    return base;
  }, [curso?.tipo, quizzes]);

  if (!curso || !tipoUtilizador) return <p>Carregando…</p>;

  return (
    <div className="pagina-curso">
      {/* Banner */}
      <div className="imagem-banner" style={{ backgroundImage: `url(${bannerUrl})` }}>
        <div className="banner-overlay">
          <h1>{curso.titulo}</h1>
          <p className="formador">{curso.nomeFormador}</p>
        </div>
      </div>

      {/* Abas */}
      <div className="tabs">
        {abas.map((a) => (
          <button
            key={a.key}
            className={abaAtiva === a.key ? "active" : ""}
            onClick={() => setAbaAtiva(a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="conteudo-tab">
        {/* ===== AULAS ===== */}
        {abaAtiva === "aulas" && (
          <div className="secao-aulas">
            {isGestorOuFormador && (
              <div
                className="botao-adicionar"
                onClick={() => navigate(`/${tipoUtilizador}/cursos/${id_curso}/aulas/nova`)}
              >
                <span>＋</span> Adicionar Aula
              </div>
            )}

            {aulas?.map((aula) => (
              <div
                key={aula.id_aula}
                className="item-tab"
                onClick={() => navigate(`/gestor/cursos/${id_curso}/aulas/${aula.id_aula}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="icon-aula">📄</div>
                <div className="info-aula">
                  <h3>{aula.titulo_aula}</h3>
                  <p>{formatarData(aula.data)}</p>
                </div>
                <div className="menu-aula">⋮</div>
              </div>
            ))}
          </div>
        )}

        {/* ===== QUIZZES ===== */}
        {abaAtiva === "quizzes" && (
          <div className="secao-aulas">
            {quizzes?.map((q) => (
              <div key={q.id_quiz} className="item-tab">
                <div className="icon-aula">📝</div>
                <div className="info-aula">
                  <h3>{q.titulo_quiz}</h3>
                  <p>{q.descricao_quiz}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== TESTES ===== */}
        {abaAtiva === "testes" && (
          <div className="secao-aulas">
            {isGestorOuFormador && (
              <div
                className="botao-adicionar"
                onClick={() => setShowNovoTeste(true)}   // ✅ abrir modal
              >
                <span>＋</span> Adicionar Teste
              </div>
            )}

            {testes?.map((t) => {
              const podeVerDetalhes = isGestorOuFormador;

              return (
                <div
                  key={t.id_teste}
                  className="item-tab"
                  onClick={() => {
                    if (podeVerDetalhes) {
                      navigate(`/${tipoUtilizador}/testes/${t.id_teste}`);
                    }
                  }}
                  style={{ cursor: podeVerDetalhes ? "pointer" : "default" }}
                  role={podeVerDetalhes ? "button" : undefined}
                  tabIndex={podeVerDetalhes ? 0 : -1}
                  onKeyDown={(e) => {
                    if (podeVerDetalhes && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      navigate(`/${tipoUtilizador}/testes/${t.id_teste}`);
                    }
                  }}
                >
                  <div className="icon-aula">🧪</div>

                  <div className="info-aula">
                    <h3>{t.titulo_teste}</h3>
                    <p>{t.descricao_teste}</p>

                    {/* Link do anexo (PDF no Cloudinary) */}
                    {t.anexo_teste && (
                      <a
                        href={t.anexo_teste}                       // ✅ URL direto Cloudinary
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}       // não abrir detalhes
                      >
                        Ver PDF
                      </a>
                    )}
                  </div>

                  {/* Submissão apenas para formando */}
                  {isFormando && (
                    <div className="resposta-teste" onClick={(e) => e.stopPropagation()}>
                      <label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handleSubmeterResposta(t.id_teste, e.target.files?.[0])
                          }
                        />
                        Submeter Resposta
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ Modal de Novo Teste */}
      <NovoTesteModal
        open={showNovoTeste}
        onClose={() => setShowNovoTeste(false)}
        id_curso={id_curso}
        curso={curso}
        onCreated={(novo) => {
          setTestes((prev) => [novo, ...prev]); // injeta o novo teste na lista
          setShowNovoTeste(false);
        }}
      />
    </div>
  );
}

// Utils
function formatarData(dataStr) {
  if (!dataStr) return "";
  const d = new Date(dataStr);
  return d.toLocaleDateString("pt-PT");
}
