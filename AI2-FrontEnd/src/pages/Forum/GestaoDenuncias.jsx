import { useEffect, useState } from 'react';
import api from '../../api';
import './GestaoDenuncias.css';

const DEFAULT_PHOTO_URL = 'https://res.cloudinary.com/di4up9s9u/image/upload/v1755691191/e_bkyeot.png'; // Update this if needed

export default function GestaoDenuncias() {
  const [denuncias, setDenuncias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    limit: 10,
    offset: 0
  });
  const [total, setTotal] = useState(0);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDenuncia, setSelectedDenuncia] = useState(null); // Changed to store the full denuncia
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user?.tipo !== 'gestor') {
      setError('Acesso negado. Apenas gestores podem visualizar denúncias.');
      setLoading(false);
      return;
    }
    carregarDenuncias();
  }, [filtros]);

  const carregarDenuncias = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filtros, limit: parseInt(filtros.limit), offset: parseInt(filtros.offset) };
      const response = await api.get('/denuncias', { params });

      if (response.data.sucesso) {
        setDenuncias(response.data.data);
        setTotal(response.data.total);
      }
    } catch (err) {
      console.error('Erro ao carregar denúncias:', err);
      setError(err.response?.data?.mensagem || 'Erro ao carregar denúncias');
    } finally {
      setLoading(false);
    }
  };

  const ocultar = async (idDenuncia, tipo, idAlvo, estado) => {
    if (!window.confirm(`Tem certeza que deseja ${estado === 'aprovado' ? 'aprovar' : 'rejeitar'} este conteúdo?`)) return;

    try {
      await api.put(`/denuncias/resolvida/${idDenuncia}`, {
        estado: estado,
        acao_tomada: `${estado === 'aprovado' ? 'Aprovado' : 'Rejeitado'} ${tipo} com ID ${idAlvo}`
      });
      alert(`Conteúdo ${estado === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso!`);
      carregarDenuncias();
    } catch (err) {
      console.error('Erro ao ocultar:', err);
      alert('Erro ao ocultar conteúdo. Verifique se a denúncia existe e você tem permissão.');
    }
  };

  const abrirModalVisualizar = (denuncia) => {
    setSelectedDenuncia(denuncia);
    setIsViewModalOpen(true);
  };

  const fecharModalVisualizar = () => {
    setIsViewModalOpen(false);
    setSelectedDenuncia(null);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <p className="gestao-denuncias-loading">Carregando denúncias...</p>;
  if (error) return <p className="gestao-denuncias-error">{error}</p>;

  return (
    <div className="gestao-denuncias-container">
      <h1 className="gestao-denuncias-title">Denúncias</h1>

      <table className="gestao-denuncias-table">
        <tbody>
          {denuncias.map(denuncia => {
            const alvo = denuncia.publicacao || denuncia.comentario || {};
            const tipo = denuncia.publicacao ? 'publicacao' : 'comentario';
            const idAlvo = denuncia.id_publicacao || denuncia.idcomentario;
            const photoUrl = denuncia.denunciante?.formador?.foto_perfil ||
                           denuncia.denunciante?.formando?.foto_perfil ||
                           DEFAULT_PHOTO_URL;

            return (
              <tr key={denuncia.id_denuncia} className="gestao-denuncias-row">
                <td className="gestao-denuncias-denunciante">
                  <img
                    src={photoUrl}
                    alt={`${denuncia.denunciante?.nome || 'Desconhecido'}'s foto`}
                    className="gestao-denuncias-foto-perfil"
                    onError={(e) => { e.target.src = DEFAULT_PHOTO_URL; }}
                  />
                  <span className="gestao-denuncias-nome">{denuncia.denunciante?.nome || 'Desconhecido'}</span>
                  <p className="gestao-denuncias-info">Denunciou {tipo} de: {alvo.autor?.nome || 'Desconhecido'}</p>
                  <p className="gestao-denuncias-info">
                    {alvo.topico_forum?.area?.nome_area || 'Geral'}
                    {' '}
                    {new Date(denuncia.data_denuncia).toLocaleDateString()}
                  </p>
                </td>
                <td className="gestao-denuncias-motivo">
                  <p className="gestao-denuncias-motivo-label">Motivo</p>
                  <p className="gestao-denuncias-motivo-text">{denuncia.motivo}</p>
                </td>
                <td className="gestao-denuncias-post">
                  <p className="gestao-denuncias-post-label">{tipo === 'publicacao' ? 'Publicação' : 'Comentário'}</p>
                  <button
                    className="gestao-denuncias-btn-visualizar"
                    onClick={() => abrirModalVisualizar(denuncia)} 
                  >
                    Visualizar
                  </button>
                </td>
                <td className="gestao-denuncias-acao">
                  {denuncia.estado === 'pendente' ? (
                    <>
                      <button
                        className="btn-aprovar"
                        onClick={() => ocultar(denuncia.id_denuncia, tipo, idAlvo, 'aprovado')}
                      >
                        Aprovar
                      </button>
                      <button
                        className="btn-rejeitar"
                        onClick={() => ocultar(denuncia.id_denuncia, tipo, idAlvo, 'rejeitado')}
                      >
                        Rejeitar
                      </button>
                    </>
                  ) : denuncia.estado === 'aprovado' ? (
                    <span className="status aprovado">Aprovada</span>
                  ) : denuncia.estado === 'rejeitado' ? (
                    <span className="status rejeitado">Rejeitada</span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="gestao-denuncias-paginacao">
        <button
          onClick={() => setFiltros(prev => ({ ...prev, offset: Math.max(0, prev.offset - parseInt(prev.limit)) }))}
          disabled={filtros.offset === 0}
          className="gestao-denuncias-btn-paginacao"
        >
          Anterior
        </button>
        <span className="gestao-denuncias-pagina-info">
          Página {Math.floor(filtros.offset / filtros.limit) + 1} de {Math.ceil(total / filtros.limit)}
        </span>
        <button
          onClick={() => setFiltros(prev => ({ ...prev, offset: prev.offset + parseInt(prev.limit) }))}
          disabled={filtros.offset + filtros.limit >= total}
          className="gestao-denuncias-btn-paginacao"
        >
          Próxima
        </button>
      </div>

      {isViewModalOpen && selectedDenuncia && (
        <div className="gestao-denuncias-modal-overlay" onClick={fecharModalVisualizar}>
          <div className="gestao-denuncias-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="gestao-denuncias-modal-title">
              {selectedDenuncia.publicacao ? 'Publicação Detalhes' : 'Comentário Detalhes'}
            </h2>
            <button className="gestao-denuncias-modal-close" onClick={fecharModalVisualizar}>
              &times;
            </button>
            <div className="gestao-denuncias-modal-body">
              {selectedDenuncia.comentario && (
                <>
                  <p><strong>Descrição do Comentário:</strong> {selectedDenuncia.comentario.descricao_comentario || 'Sem descrição'}</p>
                  <p><strong>Autor do Comentário:</strong> {selectedDenuncia.comentario.autor?.nome || 'Desconhecido'}</p>
                  <p><strong>Data do Comentário:</strong> {new Date(selectedDenuncia.comentario.data_comentario).toLocaleDateString()}</p>
                </>
              )}
              {selectedDenuncia.publicacao && (
                <>
                  <p><strong>Título da Publicação:</strong> {selectedDenuncia.publicacao.titulo_publicacao || 'Sem título'}</p>
                  <p><strong>Descrição da Publicação:</strong> {selectedDenuncia.publicacao.descricao_publicacao || 'Sem descrição'}</p>
                  <p><strong>Data da Publicação:</strong> {new Date(selectedDenuncia.publicacao.data_publicacao).toLocaleDateString()}</p>
                  <p><strong>Autor da Publicação:</strong> {selectedDenuncia.publicacao.autor?.nome || 'Desconhecido'}</p>
                  {selectedDenuncia.publicacao.anexos && selectedDenuncia.publicacao.anexos.length > 0 && (
                    <div>
                      <strong>Anexos:</strong>
                      {selectedDenuncia.publicacao.anexos.map(anexo => (
                        <div key={anexo.idanexo_publicacao} className="gestao-denuncias-modal-attachment">
                          <a href={anexo.filename} target="_blank" rel="noopener noreferrer">
                            {anexo.nome_original} (Download)
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}