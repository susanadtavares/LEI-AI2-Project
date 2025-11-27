import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api';
import ModalAddPost from '../../components/ModalAddPost';
import ModalViewPost from '../../components/ModalViewPost';
import ModalDenuncia from '../../components/ModalDenuncia';
import './ForumPosts.css';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      console.error('Erro capturado no ErrorBoundary:', error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="error-boundary">
        <h1>Ocorreu um erro ao carregar os posts.</h1>
        <p>Por favor, tente novamente ou contacte o suporte.</p>
      </div>
    );
  }

  return children;
};

const ForumPosts = () => {
  const location = useLocation();
  const { topicoId, area } = location.state || {};
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [isViewPostModalOpen, setIsViewPostModalOpen] = useState(false);
  const [isDenunciaModalOpen, setIsDenunciaModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const carregarPosts = async () => {
    if (!topicoId || !area) {
      setError('Tópico ou área não encontrados. Volte e selecione um tópico.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = `/publicacao/posts/${topicoId}`;
      const res = await api.get(url, { params: { includeComments: true }, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const postsData = Array.isArray(res.data.data) ? res.data.data : res.data;
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      const postsWithVotes = await Promise.all(
        postsData.map(async (post) => {
          try {
            const voteResponse = await api.get(`/votos-publicacao/${post.id_publicacao}/voto`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const commentResponse = await api.get(`/comentario/post/${post.id_publicacao}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            return {
              ...post,
              upvotes: voteResponse.data.upvotes || post.upvote_count || 0,
              downvotes: voteResponse.data.downvotes || post.downvote_count || 0,
              userVote: voteResponse.data.user_vote || null,
              comentarios: commentResponse.data || []
            };
          } catch (voteErr) {
            console.warn(`Erro ao carregar votos para post ${post.id_publicacao}:`, voteErr.message);
            return {
              ...post,
              upvotes: post.upvote_count || 0,
              downvotes: post.downvote_count || 0,
              userVote: null,
              comentarios: []
            };
          }
        })
      );
      setPosts(postsWithVotes);
    } catch (err) {
      console.error('Erro ao carregar posts - Detalhes:', err.response?.data || err.message);
      setError(`Erro ao carregar posts: ${err.response?.data?.mensagem || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered with topicoId:', topicoId, 'area:', area, 'user:', user);
    carregarPosts();
  }, [topicoId, area]); // Removido user das dependências

  const adicionarPost = () => {
    if (!user?.id_utilizador) {
      setError('Você precisa estar logado para adicionar um post.');
      return;
    }
    setIsAddPostModalOpen(true);
  };

  const abrirModalComentarios = (postId) => {
    if (!postId) {
      setError('ID do post inválido.');
      return;
    }
    setSelectedPostId(postId);
    setIsViewPostModalOpen(true);
  };

  const abrirModalDenuncia = (postId, commentId = null) => {
    setSelectedPostId(postId);
    setSelectedCommentId(commentId);
    setIsDenunciaModalOpen(true);
  };

  const handleModalClose = (type) => {
    if (type === 'add' || type === 'denuncia') {
      setIsAddPostModalOpen(false);
      setIsDenunciaModalOpen(false);
      setSelectedPostId(null);
      setSelectedCommentId(null);
      carregarPosts(); // Recarregar apenas após adicionar ou denunciar
    } else if (type === 'view') {
      setIsViewPostModalOpen(false);
      setSelectedPostId(null);
    }
  };

  const handleModalSuccess = () => {
    carregarPosts();
  };

  const deletarPost = async (postId) => {
    if (!window.confirm('Tem certeza que deseja excluir este post?')) return;
    try {
      if (user?.tipo !== 'gestor') {
        alert('Apenas Gestores podem excluir posts.');
        return;
      }
      await api.delete(`/publicacao/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Post excluído com sucesso!');
      carregarPosts();
    } catch (err) {
      console.error('Erro ao excluir post:', err);
      alert(`Erro ao excluir post: ${err.response?.data?.mensagem || err.message}`);
    }
  };

  const votar = async (postId, direcao) => {
    try {
      const response = await api.post(`/votos-publicacao/${postId}/voto`, {
        id_utilizador: user.id_utilizador,
        direcao
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPosts(posts.map(post =>
        post.id_publicacao === postId
          ? { ...post, upvotes: response.data.upvotes, downvotes: response.data.downvotes, userVote: response.data.user_vote }
          : post
      ));
    } catch (err) {
      console.error('Erro ao votar - Detalhes:', err.response?.data || err.message);
      alert(`Erro ao votar: ${err.response?.data?.erro || err.message}`);
    }
  };

  if (loading) return <p className="loading">Carregando posts...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!topicoId || !area) return <p className="error">Erro: Tópico ou área não selecionada.</p>;

  return (
    <ErrorBoundary>
      <div className="pagina-forum-posts">
        <header className="forum-header">
          <img src="/assets/banner-forum.jpg" alt="Banner do Fórum" className="header-image" />
          <h1 className="topic-title">{posts[0]?.titulo_publicacao || 'Posts do Tópico'}</h1>
        </header>
        <div className="forum-content">
          <main className="main-content">
            <div className="posts-header">
              <h2>Posts</h2>
              {user?.id_utilizador && (
                <button className="btn-add-post" onClick={adicionarPost}>
                  + Adicionar Post
                </button>
              )}
            </div>
            <div className="posts-list">
              {posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id_publicacao} className="post-card">
                    <div className="post-votes">
                      <button
                        className={`vote-button ${post.userVote === 'up' ? 'voted-up' : ''}`}
                        onClick={() => votar(post.id_publicacao, 'up')}
                        disabled={!user?.id_utilizador}
                      >
                        ↑ {post.upvotes}
                      </button>
                      <button
                        className={`vote-button ${post.userVote === 'down' ? 'voted-down' : ''}`}
                        onClick={() => votar(post.id_publicacao, 'down')}
                        disabled={!user?.id_utilizador}
                      >
                        ↓ {post.downvotes}
                      </button>
                    </div>
                    <div className="post-content">
                      <h3>{post.titulo_publicacao || 'Sem título'}</h3>
                      <p>
                        Publicado por {post.autor?.nome || 'Anônimo'} em{' '}
                        {new Date(post.data_publicacao).toLocaleDateString('pt-PT')}
                      </p>
                      <p>{post.descricao_publicacao || 'Sem descrição'}</p>
                      <div className="post-attachments">
                        {post.anexos && post.anexos.length > 0 ? (
                          post.anexos.map(anexo => (
                            <div key={anexo.idanexo_publicacao} className="attachment">
                              {anexo.mimetype.startsWith('image/') ? (
                                <img
                                  src={anexo.filename || '/assets/placeholder.jpg'}
                                  alt={anexo.nome_original}
                                  className="attachment-image"
                                  onError={(e) => (e.target.src = '/assets/placeholder.jpg')}
                                />
                              ) : anexo.mimetype.startsWith('video/') ? (
                                <video
                                  controls
                                  className="attachment-video"
                                  onError={() => console.error(`Erro ao carregar vídeo: ${anexo.filename}`)}
                                >
                                  <source src={anexo.filename || ''} type={anexo.mimetype} />
                                  Seu navegador não suporta vídeos.
                                </video>
                              ) : ['application/pdf', 'application/octet-stream'].includes(anexo.mimetype) ? (
                                <a
                                  href={anexo.filename || '#'}
                                  download={anexo.nome_original}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="attachment-link"
                                  onClick={(e) => {
                                    if (!anexo.filename) e.preventDefault();
                                  }}
                                >
                                  {anexo.nome_original} (Download)
                                </a>
                              ) : ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'].includes(anexo.mimetype) ? (
                                <a
                                  href={anexo.filename || '#'}
                                  download={anexo.nome_original}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="attachment-link"
                                >
                                  {anexo.nome_original} (Download)
                                </a>
                              ) : (
                                <a
                                  href={anexo.filename || '#'}
                                  download={anexo.nome_original}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="attachment-link"
                                >
                                  {anexo.nome_original} (Download)
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <p>Nenhum anexo</p>
                        )}
                      </div>
                      <div className="post-actions">
                        <button
                          className="btn-view-comments"
                          onClick={() => abrirModalComentarios(post.id_publicacao)}
                          disabled={!post.id_publicacao}
                        >
                          Ver Comentários ({post.comentarios.length})
                        </button>
                        {(user?.tipo === 'formador' || user?.tipo === 'formando') && (
                          <button
                            className="btn-denunciar"
                            onClick={() => abrirModalDenuncia(post.id_publicacao)}
                            disabled={!post.id_publicacao}
                          >
                            Denunciar
                          </button>
                        )}
                        {user?.tipo === 'gestor' && (
                          <button
                            className="btn-delete-post"
                            onClick={() => deletarPost(post.id_publicacao)}
                            disabled={!post.id_publicacao}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                    {post.comentarios && post.comentarios.length > 0 && (
                      <div className="post-comments">
                        {post.comentarios.map(comment => (
                          <div key={comment.idcomentario} className="comment-card">
                            <p>{comment.descricao_comentario || 'Sem conteúdo'}</p>
                            <p>Por: {comment.autor?.nome || 'Anônimo'} - {new Date(comment.data_comentario).toLocaleDateString('pt-PT')}</p>
                            {(user?.tipo === 'formador' || user?.tipo === 'formando') && (
                              <button
                                className="btn-denunciar"
                                onClick={() => abrirModalDenuncia(post.id_publicacao, comment.idcomentario)}
                                disabled={!comment.idcomentario}
                              >
                                Denunciar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-posts">Nenhuma postagem disponível.</p>
              )}
            </div>
          </main>
        </div>
        {isAddPostModalOpen && <ModalAddPost topicoId={topicoId} area={area} onClose={() => handleModalClose('add')} onSuccess={handleModalSuccess} />}
        {isViewPostModalOpen && <ModalViewPost postId={selectedPostId} onClose={() => handleModalClose('view')} onSuccess={handleModalSuccess} />}
        {isDenunciaModalOpen && <ModalDenuncia postId={selectedPostId} commentId={selectedCommentId} onClose={() => handleModalClose('denuncia')} />}
      </div>
    </ErrorBoundary>
  );
};

export default ForumPosts;