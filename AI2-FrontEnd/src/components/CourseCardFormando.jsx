// src/components/CourseCardFormando.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./CourseCardFormando.css";

const DEFAULT_IMAGE_URL =
  "https://res.cloudinary.com/di4up9s9u/image/upload/v1755604007/defaultcurso_w0zceo.png";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:3001"; // usado para imagens relativas

function buildThumbUrl(curso) {
  const src =
    curso?.tumbnail || // (typo comum)
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

export default function CourseCardFormando({ curso, nomeFormador }) {
  const navigate = useNavigate();

  // Normaliza id vindo de diferentes endpoints
  const id =
    curso?.id_curso ??
    curso?.id ??
    curso?.curso_id ??
    curso?.ID ??
    null;

  const handleCardClick = () => {
    if (!id) {
      console.warn("Curso sem ID válido para navegação:", curso);
      return;
    }
    // tua rota atual: /formando/cursos/:id
    navigate(`/formando/cursos/${id}`);
  };

  const titulo = curso?.titulo || curso?.nome || "Curso";
  const descricao = curso?.descricao || curso?.descricao_curta || "";

  return (
    <div className="course-card-formando" onClick={handleCardClick} role="button">
      <div className="thumbnail">
        <img
          src={buildThumbUrl(curso)}
          alt={titulo}
        />
      </div>
      <div className="card-body">
        <h3 className="curso-titulo">{titulo}</h3>
        {descricao && <p className="curso-descricao">{descricao}</p>}
        <p className="curso-formador">
          <strong>Formador:</strong> {nomeFormador || curso?.nomeFormador || curso?.nome_formador || "N/A"}
        </p>
      </div>
    </div>
  );
}
