import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api';
import ModalAddTopic from '../../components/ModalAddTopic';
import ModalEditTopic from '../../components/ModalEditTopic';
import './ForumAreaTopicos.css';

export default function ForumAreaTopics() {
  const navigate = useNavigate();
  const location = useLocation();
  const area = location.state?.area;
  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTopicoId, setSelectedTopicoId] = useState(null);

  useEffect(() => {
    if (!area) {
      setError('Área não encontrada. Volte e selecione uma área.');
      setLoading(false);
      return;
    }
    carregarTopicos();
  }, [area]);

  const carregarTopicos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/topicos-forum/area/${area.id_area}`);
      console.log('Resposta da API:', res.data);
      const topicosData = res.data.data || res.data;
      if (!Array.isArray(topicosData)) {
        throw new Error('Dados de tópicos inválidos');
      }
      setTopicos(topicosData);
    } catch (err) {
      console.error('Erro ao carregar tópicos:', err.response?.data || err.message);
      setError('Erro ao carregar tópicos. Verifique o console para detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const navegarParaPosts = (topicoId) => {
    const userRole = JSON.parse(localStorage.getItem('user'))?.tipo;
    const basePath = userRole === 'gestor' ? '/gestor/forum' : userRole === 'formando' ? '/forum/formando' : '/forum/formador';
    navigate(`${basePath}/posts/${topicoId}`, { state: { area, topicoId } }); 
  };

  const adicionarTopico = () => {
    console.log('Adicionar Tópico clicado, userRole:', JSON.parse(localStorage.getItem('user'))?.tipo);
    if (JSON.parse(localStorage.getItem('user'))?.tipo === 'gestor') {
      setIsAddModalOpen(true);
    } else {
      alert('Apenas gestores podem adicionar tópicos.');
    }
  };

  const editarTopico = (topicoId) => {
    console.log('Editar Tópico clicado, topicoId:', topicoId);
    if (JSON.parse(localStorage.getItem('user'))?.tipo === 'gestor') {
      setSelectedTopicoId(topicoId);
      setIsEditModalOpen(true);
    }
  };

  const eliminarTopico = async (topicoId) => {
    if (window.confirm('Tem certeza de que deseja eliminar este tópico?')) {
      try {
        await api.delete(`/topicos-forum/${topicoId}`);
        setTopicos(topicos.filter(t => t.id_topico_forum !== topicoId));
        alert('Tópico eliminado com sucesso!');
      } catch (err) {
        console.error('Erro ao eliminar tópico:', err);
        alert('Erro ao eliminar o tópico. Tente novamente.');
      }
    }
  };

  const handleModalClose = (modalType) => {
    if (modalType === 'add') setIsAddModalOpen(false);
    if (modalType === 'edit') setIsEditModalOpen(false);
    carregarTopicos(); 
  };

  const handleModalSuccess = () => {
    carregarTopicos(); 
  };

  if (loading) return <p className="loading">Carregando tópicos...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!area) return <p>Erro: Área não selecionada.</p>;

  return (
    <div className="pagina-forum-topics">
      <header className="forum-header">
        <img src="/src/assets/banner-forum.jpg" alt="Banner do Fórum" className="header-image" />
        <h1 className="area-title">{area.nome_area}</h1>
      </header>
      <div className="forum-content">
        <main className="main-content">
          <div className="topics-header">
            <h2>Tópicos</h2>
            {JSON.parse(localStorage.getItem('user'))?.tipo === 'gestor' && (
              <button className="btn-add-topic" onClick={adicionarTopico}>
                + Adicionar Tópico
              </button>
            )}
          </div>
          <div className="topics-table-wrapper">
            {topicos.length > 0 ? (
              <table className="topics-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Descrição</th>
                    <th>Posts</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {topicos.map(topico => (
                    <tr key={topico.id_topico_forum} className="topic-row">
                      <td className="topic-cell">{topico.titulo_topico || 'Sem título'}</td>
                      <td className="topic-cell">{topico.descricao_topico || 'Sem descrição'}</td>
                      <td className="topic-cell">{topico.total_posts !== undefined ? topico.total_posts : 0}</td>
                      <td className="topic-cell actions">
                        <button
                          className="btn-view-posts"
                          onClick={() => navegarParaPosts(topico.id_topico_forum)}
                        >
                          Ver Posts
                        </button>
                        {JSON.parse(localStorage.getItem('user'))?.tipo === 'gestor' && (
                          <>
                            <button
                              className="btn-edit-topic"
                              onClick={() => editarTopico(topico.id_topico_forum)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn-delete-topic"
                              onClick={() => eliminarTopico(topico.id_topico_forum)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-topics">Nenhum tópico disponível.</p>
            )}
          </div>
        </main>
      </div>
      {isAddModalOpen && <ModalAddTopic area={area} onClose={() => handleModalClose('add')} onSuccess={handleModalSuccess} />}
      {isEditModalOpen && <ModalEditTopic topicoId={selectedTopicoId} area={area} onClose={() => handleModalClose('edit')} onSuccess={handleModalSuccess} />}
    </div>
  );
}