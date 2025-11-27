// DashboardFormador.jsx
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faClock,
  faChalkboardTeacher,
  faSpinner,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import CursoCard from "../../components/CourseCardFormador";
import api from "../../api";
import "./DashboardFormador.css";

export default function DashboardFormador() {
  const [user, setUser] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (!u) { setLoading(false); return; }
    setUser(u);

    (async () => {
      try {
        // garantir id_formador
        let idFormador = u.id_formador;
        if (!idFormador && u.id_utilizador) {
          const res = await api.get("/formadores");
          const lista = Array.isArray(res.data) ? res.data : [];
          const me = lista.find(f => Number(f.id_utilizador) === Number(u.id_utilizador));
          idFormador = me?.id_formador;
        }
        if (!idFormador) {
          console.warn("Não foi possível determinar o id_formador para este utilizador.");
          setCursos([]);
          return;
        }

        // buscar cursos (usa o que tens no backend)
        // const r = await api.get(`/formadores/${idFormador}/cursos`);
        const r = await api.get(`/cursos`, { params: { formador: idFormador, backoffice: true } });

        const data = r.data?.data ?? r.data ?? [];
        setCursos(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Erro ao buscar cursos do formador:", e?.response?.data || e.message);
        setCursos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const horasTotal = cursos.reduce((total, c) => total + (Number(c.duracao) || 0), 0);

  return (
    <div className="dashboard">
      {/* BANNER */}
      <div className="dashboard-banner">
        <div className="banner-inner">
          <h1 className="dashboard-title">
            <FontAwesomeIcon icon={faChalkboardTeacher} />&nbsp;
            Olá, {user.nome || user.utilizador?.nome || "Formador"}!
          </h1>

          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Cursos</p>
                <p className="stat-value">{cursos.length}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Horas Ministradas</p>
                <p className="stat-value">{horasTotal}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="dashboard-content">
        <h2 className="section-title">
          <FontAwesomeIcon icon={faGraduationCap} />&nbsp;Os meus Cursos
        </h2>

        <div className="gestao-cursos-grid">
          {cursos.length > 0 ? (
            cursos.map((curso) => (
              <CursoCard
                key={curso.id_curso}
                curso={curso}
                nomeFormador={user.nome || user.utilizador?.nome}
              />
            ))
          ) : (
            <p>
              <FontAwesomeIcon icon={faBookOpen} />&nbsp;Sem cursos atribuídos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
