// src/pages/Formando/DashboardFormando.jsx
import { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCheckCircle,
  faClock,
  faGraduationCap,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import CursoCardFormando from "../../components/CourseCardFormando";
import api from "../../api";
import "./DashboardFormando.css";

/* ----------------- Helpers ----------------- */
function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

async function resolveIdFormando(api, user) {
  if (!user) return null;
  if (user.id_formando) return Number(user.id_formando);

  const idUtil = user.id_utilizador ?? user.id ?? user.user_id;
  if (!idUtil) return null;

  // tenta uma rota dedicada, se existir
  try {
    const got = await api.get(`/formandos/por-utilizador/${idUtil}`);
    const f = unwrap(got);
    if (f?.id_formando) return Number(f.id_formando);
  } catch {
    // ignora, tenta fallback
  }

  // fallback: lista de formandos
  try {
    const fr = await api.get(`/formandos`);
    const lista = unwrap(fr) || [];
    const me = Array.isArray(lista)
      ? lista.find((x) => Number(x.id_utilizador) === Number(idUtil))
      : null;
    if (me?.id_formando) return Number(me.id_formando);
  } catch {
    // ignora
  }

  return null;
}

/** devolve array de cursos do formando; tenta /formandos/:id/cursos e cai para /inscricoes */
async function getMeusCursos(api, idFormando) {
  // 1) tenta endpoint direto
  try {
    const r = await api.get(`/formandos/${idFormando}/cursos`);
    const arr = unwrap(r);
    if (Array.isArray(arr)) return arr;
  } catch {
    // continua para fallback
  }

  // 2) fallback via /inscricoes?formando=
  try {
    const ir = await api.get(`/inscricoes?formando=${idFormando}`);
    const inscricoes = unwrap(ir) || [];
    const ids = [...new Set(inscricoes.map((i) => Number(i.id_curso)).filter(Boolean))];

    const cursos = await Promise.all(
      ids.map((id) =>
        api
          .get(`/cursos/${id}`)
          .then((res) => unwrap(res))
          .catch(() => null)
      )
    );

    // injeta estado/completo (para filtros/estatísticas)
    return cursos
      .filter(Boolean)
      .map((c) => {
        const inc = inscricoes.find((i) => Number(i.id_curso) === Number(c.id_curso));
        const estado = inc?.estado ?? inc?.status ?? null;
        const completo = typeof estado === "string" && estado.toLowerCase() === "completo";
        return { ...c, estado, completo };
      });
  } catch {
    return [];
  }
}

/* ----------------- Componente ----------------- */
export default function DashboardFormando() {
  const [user, setUser] = useState(null);
  const [meusCursos, setMeusCursos] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("todos"); // "todos" | "meus"
  const [filtro, setFiltro] = useState("tudo"); // "tudo" | "completos"

  useEffect(() => {
    (async () => {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (!u) {
        setLoading(false);
        return;
      }
      setUser(u);

      try {
        // 1) Cursos públicos/visíveis
        const allRes = await api.get("/cursos"); // backend já filtra por curso_visivel=true
        const all = unwrap(allRes);
        setTodosCursos(Array.isArray(all) ? all : []);

        // 2) Meus cursos — robusto com fallback via /inscricoes
        const idFormando = await resolveIdFormando(api, u);
        if (idFormando) {
          const mine = await getMeusCursos(api, idFormando);
          setMeusCursos(Array.isArray(mine) ? mine : []);
        } else {
          setMeusCursos([]);
        }
      } catch (e) {
        console.error("Erro ao carregar cursos:", e?.response?.data || e.message);
        setTodosCursos([]);
        setMeusCursos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // origem dos dados conforme tab
  const base = tab === "todos" ? todosCursos : meusCursos;

  // aplica filtro apenas em "meus"
  const cursosFiltrados = useMemo(() => {
    if (tab === "todos") return base;
    if (filtro === "completos") {
      return base.filter(
        (c) =>
          (c.estado || c.status || "").toLowerCase() === "completo" ||
          c.completo === true
      );
    }
    return base; // "tudo"
  }, [base, tab, filtro]);

  if (!user) {
    return (
      <div className="dashboard-loader">
        <FontAwesomeIcon icon={faSpinner} spin />&nbsp;A carregar utilizador...
      </div>
    );
  }
  if (loading) {
    return (
      <div className="dashboard-loader">
        <FontAwesomeIcon icon={faSpinner} spin />&nbsp;A carregar cursos...
      </div>
    );
  }

  const completos = meusCursos.filter(
    (c) =>
      (c.estado || c.status || "").toLowerCase() === "completo" ||
      c.completo === true
  );
  const horasCompletas = meusCursos.reduce((acc, c) => {
    const done =
      (c.estado || c.status || "").toLowerCase() === "completo" ||
      c.completo === true;
    return acc + (done ? Number(c.duracao) || 0 : 0);
    // se não tiveres "duracao" por curso, adapta aqui (ex.: somar horas por aulas concluídas)
  }, 0);

  return (
    <div className="dashboard">
      {/* BANNER */}
      <div className="dashboard-banner">
        <div className="banner-inner">
          <h1 className="dashboard-title">
            <FontAwesomeIcon icon={faGraduationCap} />&nbsp;
            Olá, {user.nome || user.utilizador?.nome || "Formando"}!
          </h1>

          {/* Estatísticas (com FontAwesome) */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faLayerGroup} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Cursos disponíveis</p>
                <p className="stat-value">{todosCursos.length}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Completos</p>
                <p className="stat-value">{completos.length}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Horas gastas</p>
                <p className="stat-value">{horasCompletas}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="dashboard-content">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={tab === "todos" ? "active" : ""}
            onClick={() => setTab("todos")}
          >
            Todos os Cursos
          </button>
          <button
            className={tab === "meus" ? "active" : ""}
            onClick={() => setTab("meus")}
          >
            Os meus Cursos
          </button>
        </div>

        {/* Filtros (apenas em "meus") */}
        {tab === "meus" && (
          <div className="filtros">
            <div className="filtros-botoes">
              <button
                className={filtro === "tudo" ? "filtro-ativo" : ""}
                onClick={() => setFiltro("tudo")}
              >
                Inscritos
              </button>
              <button
                className={filtro === "completos" ? "filtro-ativo" : ""}
                onClick={() => setFiltro("completos")}
              >
                Completos
              </button>
            </div>
            <div className="filtros-label">
              Filtros: <span>{filtro}</span>
            </div>
          </div>
        )}

        {/* Grelha */}
        <div className="course-grid">
          {cursosFiltrados.map((curso) => {
            const key =
              curso.id_curso ?? curso.id ?? curso.curso_id ?? crypto.randomUUID();
            return (
              <CursoCardFormando
                key={key}
                curso={curso}
                nomeFormador={curso.nomeFormador || curso.nome_formador}
              />
            );
          })}
          {cursosFiltrados.length === 0 && (
            <p style={{ color: "var(--subtext, #6b7280)" }}>
              Sem cursos para mostrar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
