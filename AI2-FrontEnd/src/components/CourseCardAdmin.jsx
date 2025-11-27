import { useNavigate } from "react-router-dom";
import "./CourseCardAdmin.css";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:3001";

const DEFAULT_IMAGE_URL =
  "https://res.cloudinary.com/di4up9s9u/image/upload/v1755608744/portal_x1e8kh.png";

function buildImageUrl(raw) {
  if (!raw) return DEFAULT_IMAGE_URL;

  // aceita várias chaves possíveis devolvidas pelo back
  const src =
    raw.tumbnail ||
    raw.thumbnail ||
    raw.imagem_url ||
    raw.url_imagem ||
    raw.foto_curso ||
    (typeof raw === "string" ? raw : "");

  if (!src) return DEFAULT_IMAGE_URL;

  // já é absoluta? usa direto
  if (/^https?:\/\//i.test(src)) return src;

  // relativa: junta à base
  if (src.startsWith("/")) return `${API_BASE}${src}`;
  return `${API_BASE}/${src}`;
}

export default function CourseCardAdmin({ curso }) {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/gestor/cursos/${curso.id_curso}`);
  };

  // passa o objeto todo para cobrir várias chaves possíveis
  const imgSrc = buildImageUrl(curso);

  return (
    <div className="course-card-admin clickable" onClick={handleClick}>
      <img
        src={imgSrc}
        alt={curso.titulo}
        className="course-image"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = DEFAULT_IMAGE_URL;
        }}
      />

      <div className="course-info">
        <h3>{curso.titulo}</h3>
        <p>
          <strong>Formador:</strong> {curso.nomeFormador || "Sem Formador"}
        </p>
        <p>
          <strong>Duração:</strong>{" "}
          {curso.duracao ? `${curso.duracao} horas` : "—"}
        </p>
        <p>
          <strong>Avaliação:</strong> {curso.avaliacao || "N/A"}
        </p>
      </div>
    </div>
  );
}
