import { useEffect, useState } from "react";
import api from "../../api";
import CursoCard from "../../components/CourseCard";
import "./perfilFormando.css";
import { useParams } from 'react-router-dom';

export default function PerfilFormando() {
  const [formando, setFormando] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id_utilizador, id_formando } = useParams();

  useEffect(() => {
    if (!id_formando || !id_utilizador) return;

    // Buscar dados do formando
    api
      .get(`/formandos/${id_utilizador}/${id_formando}`)
      .then((res) => setFormando(res.data))
      .catch((err) => console.error("Erro ao buscar formando:", err));

    // Buscar cursos do formando
    api
      .get(`/formandos/${id_utilizador}/${id_formando}/cursos`)
      .then((res) => setCursos(res.data))
      .catch((err) => console.error("Erro ao buscar cursos:", err))
      .finally(() => setLoading(false));
  }, [id_formando, id_utilizador]);


  if (loading) return <p className="perfil-loader">A carregar perfil...</p>;
  if (!formando) return <p className="perfil-loader">Formando não encontrado.</p>;

  const cursosConcluidos = cursos.filter(c => c.estado === "completo");
  const cursosInscritos = cursos.filter(c => c.estado === "inscrito");
  const horas = cursosConcluidos.reduce((acc, c) => acc + (c.duracao || 0), 0);

  return (
    <div className="perfil-formando">
      <div className="perfil-header">
        <div className="perfil-info">
          <h1>{formando.nome}</h1>
          <p>{formando.email}</p>
          <div className="perfil-stats">
            <div><strong>Cursos acabados</strong><p>{cursosConcluidos.length}</p></div>
            <div><strong>Cursos inscritos</strong><p>{cursosInscritos.length}</p></div>
            <div><strong>Horas Gastas</strong><p>{horas}h</p></div>
          </div>
        </div>
        <div className="perfil-foto">
          <img src={formando.foto_perfil || "/default-avatar.png"} alt="Foto do Formando" />
        </div>
      </div>

      <div className="perfil-cursos">
        <h2>Cursos Concluídos</h2>
        <div className="curso-grid">
          {cursosConcluidos.map((curso) => (
            <CursoCard key={curso.id_curso} curso={curso} nomeFormador={curso.nome_formador} />
          ))}
        </div>
      </div>
    </div>
  );
}
