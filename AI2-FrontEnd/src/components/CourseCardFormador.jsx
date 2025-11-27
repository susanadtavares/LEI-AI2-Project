import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faChalkboardTeacher,
  faPlayCircle,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import "./CourseCardFormador.css";

export default function CursoCard({ curso, nomeFormador }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/formador/cursos/${curso.id_curso}`);
  };

  // Resolve imagem (Cloudinary absoluta ou caminho local do backend)
  const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    "http://localhost:3001";

  const thumb = curso?.tumbnail || curso?.thumbnail || curso?.imagem_url || "";
  const imageSrc = thumb
    ? /^https?:\/\//i.test(thumb)
      ? thumb
      : `${API_BASE}${thumb.startsWith("/") ? "" : "/"}${thumb}`
    : "";

  const tipo = curso?.tipo || "Sincrono";
  const isSincrono = tipo === "Sincrono";

  const duracaoHoras =
    Number(curso?.duracao) ||
    (curso?.data_inicio && curso?.data_fim
      ? Math.max(
          0,
          Math.round(
            (new Date(curso.data_fim) - new Date(curso.data_inicio)) / 36e5
          )
        )
      : 0);

  return (
    <div className="course-card-admin clickable" onClick={handleClick}>
      {imageSrc ? (
        <img src={imageSrc} alt={curso.titulo} className="course-image" />
      ) : (
        <div className="course-image-placeholder">Sem imagem</div>
      )}

      <div className="course-info">
        <h3 title={curso.titulo}>{curso.titulo}</h3>

        {/* Badge do tipo */}
        <div className="ccf-badges">
          <span className={`ccf-badge ${isSincrono ? "is-live" : "is-async"}`}>
            <FontAwesomeIcon
              icon={isSincrono ? faChalkboardTeacher : faPlayCircle}
              className="ccf-badge-icon"
              fixedWidth
            />
            {isSincrono ? "Síncrono" : "Assíncrono"}
          </span>
        </div>

        {/* Meta com ícones */}
        <div className="ccf-meta">
          <div className="ccf-meta-item" title={`${duracaoHoras} horas`}>
            <span className="ccf-icon">
              <FontAwesomeIcon icon={faClock} fixedWidth />
            </span>
            <span>{duracaoHoras} h</span>
          </div>

          <div
            className="ccf-meta-item ccf-formador"
            title={nomeFormador || "Sem Formador"}
          >
            <span className="ccf-icon">
              <FontAwesomeIcon icon={faChalkboardTeacher} fixedWidth />
            </span>
            <span className="ccf-ellipsis">
              {nomeFormador || "Sem Formador"}
            </span>
          </div>

          <div className="ccf-meta-item" title="Avaliação">
            <span className="ccf-icon">
              <FontAwesomeIcon icon={faStar} fixedWidth />
            </span>
            <span>{curso?.avaliacao ?? "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
