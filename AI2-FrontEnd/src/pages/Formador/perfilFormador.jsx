import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api";
import './perfilFormador.css';

export default function PerfilFormador() {
  const { id_utilizador, id_formador } = useParams(); 
  const [formador, setFormador] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id_utilizador || !id_formador) return;

    const fetchData = async () => {
      try {
        const [formadorRes, cursosRes] = await Promise.all([
          api.get(`/formadores/${id_utilizador}/${id_formador}`),
          api.get(`/formadores/${id_formador}/cursos`)
        ]);

        setFormador(formadorRes.data);
        setCursos(cursosRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados do formador ou cursos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_utilizador, id_formador]);

  if (loading) return <p>A carregar perfil...</p>;
  if (!formador) return <p>Formador não encontrado.</p>;

  return (
    <div>
      <div className="perfil-formador">
        <div className="topo">
          <div className="info">
            <h2>{formador.nome}</h2>
            <p>{formador.email}</p>
            <div className="stats">
              <div>
                <strong>Total de Formandos</strong>
                <p>{formador.total_formandos}</p>
              </div>
              <div>
                <strong>Cursos</strong>
                <p>{formador.total_cursos}</p>
              </div>
            </div>
          </div>
          <div className="foto-area">
            <img src={formador.foto_perfil || "/default-avatar.png"} alt="Foto Formador" className="foto" />
            <button className="btn-mensagem">Enviar Mensagem</button>
          </div>
        </div>

        <div className="descricao">
          <h3>Descrição</h3>
          <p>{formador.descricao_formador}</p>
        </div>

        <div className="cartao-info">
          <div>
            <h4>Experiência</h4>
            <p>{formador.habilidades_formador}</p>
          </div>
          <div>
            <h4>Certificações</h4>
            <ul>
              {formador.certificacoes_formador?.split(',').map((c, i) => <li key={i}>{c.trim()}</li>)}
            </ul>
          </div>
          <div>
            <h4>Formação Académica</h4>
            <p>{formador.educacao_formador}</p>
          </div>
        </div>

        <div className="cursos-do-formador">
          <h3>Cursos que leciona</h3>
          <ul className="lista-cursos">
            {cursos.map(curso => (
              <li key={curso.id_curso}>
                📘 {curso.titulo} ({curso.duracao}h)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
