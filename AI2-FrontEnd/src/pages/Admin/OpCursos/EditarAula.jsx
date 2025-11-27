import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api';
import './EditarAula.css';

export default function EditarAula() {
  const { id_aula } = useParams();
  const [aula, setAula] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [novosAnexos, setNovosAnexos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/aulas/${id_aula}`).then(res => {
      setAula(res.data);
      setTitulo(res.data.titulo_aula);
      setDescricao(res.data.descricao_aula || '');
    });
  }, [id_aula]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('titulo_aula', titulo);
    formData.append('descricao_aula', descricao);
    novosAnexos.forEach((file) => formData.append('anexos', file));

    try {
      await api.put(`/aulas/${id_aula}`, formData);
      alert('Aula atualizada com sucesso!');
      navigate(`/gestor/cursos/sincrono/${aula.id_curso}`);
    } catch (err) {
      console.error('Erro ao atualizar aula:', err);
    }
  };

  if (!aula) return <p>A carregar...</p>;

  return (
    <div className="pagina-editar-aula">
      <form className="form-editar-aula" onSubmit={handleSubmit}>
        <div className="cabecalho-edicao">
          <div className="icone">🖋️</div>
          <div>
            <h1>Editar Aula</h1>
            <p>{aula.titulo_aula}</p>
          </div>
        </div>

        <label>Título da Aula</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />

        <label>Descrição</label>
        <textarea
          rows="6"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <div className="anexos-area">
          <div className="topo">
            <h3>Anexos</h3>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.ppt,.txt"
              onChange={(e) => setNovosAnexos(Array.from(e.target.files))}
            />
          </div>
          {(aula.anexos || []).map((anexo, i) => (
            <div key={i} className="anexo-item">
              <span>{anexo.nome}</span>
              <button type="button" className="btn-remover">Remover</button>
            </div>
          ))}
        </div>

        <div className="botoes-final">
          <button type="submit" className="btn-guardar">Guardar</button>
          <button type="button" className="btn-cancelar" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
