import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './ModalViewPost.css';

export default function ModalViewPost({ postId, onClose, onSuccess }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [parentId, setParentId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const buildCommentHierarchy = (flatComments) => {
    const map = new Map();
    const rootComments = [];

    flatComments.forEach(comment => {
      comment.replies = [];
      map.set(comment.idcomentario, comment);
    });

    flatComments.forEach(comment => {
      if (comment.parent_id && map.has(comment.parent_id)) {
        map.get(comment.parent_id).replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  };

  useEffect(() => {
    const carregarPostEComentarios = async () => {
      try {
        let token = user?.token;

        if (!token && localStorage.getItem('token')) {
          try {
            token = JSON.parse(localStorage.getItem('token'));
          } catch (parseError) {
            token = localStorage.getItem('token');
          }
        }

        if (!token) {
          setError('Nenhum token de autenticação encontrado. Faça login novamente.');
          navigate('/login');
          return;
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        console.log('Carregando post com ID:', postId);
        const resPost = await api.get(`/publicacao/${postId}`);
        console.log('Resposta do post:', resPost.data);
        setPost(resPost.data);

        console.log('Carregando comentários para postId:', postId);
        const resComments = await api.get(`/comentarios/publicacao/${postId}`);
        console.log('Resposta bruta dos comentários do backend:', JSON.stringify(resComments.data, null, 2));

        const hierarchicalComments = buildCommentHierarchy(resComments.data || []);
        setComments(hierarchicalComments);
        console.log('Comentários hierárquicos:', JSON.stringify(hierarchicalComments, null, 2));
      } catch (err) {
        console.error('Erro ao carregar post ou comentários:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.response?.config?.url,
        });
        if (err.response?.status === 401) {
          setError('Sessão expirada. Faça login novamente.');
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError(`Publicação com ID ${postId} não encontrada ou rota inválida. Verifique o console para detalhes.`);
        } else {
          setError(`Erro ao carregar dados: ${err.response?.data?.erro || err.response?.data?.mensagem || err.message}`);
        }
      }
    };
    carregarPostEComentarios();
  }, [postId, navigate]);

  const handleReply = (commentId) => {
    console.log('Clicou em Responder para commentId:', commentId);
    setReplyTarget(commentId);
    setParentId(commentId);
    setNewComment('');
  };

  const adicionarComentario = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setError('O comentário não pode estar vazio.');
      return;
    }

    try {
      let token = user?.token;

      if (!token && localStorage.getItem('token')) {
        try {
          token = JSON.parse(localStorage.getItem('token'));
        } catch (parseError) {
          token = localStorage.getItem('token');
        }
      }

      if (!token) {
        setError('Nenhum token de autenticação encontrado. Faça login novamente.');
        navigate('/login');
        return;
      }

      const userId = user?.id_utilizador;
      if (!userId) {
        setError('ID do utilizador não encontrado. Faça login novamente.');
        navigate('/login');
        return;
      }

      console.log('Enviando comentário:', { id_publicacao: postId, id_utilizador: userId, descricao_comentario: newComment, parent_id: parentId });
      await api.post('/comentarios', {
        id_publicacao: postId,
        id_utilizador: userId,
        descricao_comentario: newComment,
        parent_id: parentId,
      });
      setNewComment('');
      setParentId(null);
      setReplyTarget(null);
      setSuccess(true);
      setTimeout(async () => {
        setSuccess(false);
        const res = await api.get(`/comentarios/publicacao/${postId}`);
        console.log('Resposta após adicionar comentário:', JSON.stringify(res.data, null, 2));

        const hierarchicalComments = buildCommentHierarchy(res.data || []);
        setComments(hierarchicalComments);
        onSuccess();
      }, 1000);
    } catch (err) {
      console.error('Erro ao adicionar comentário:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      if (err.response?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
        navigate('/login');
      } else {
        setError(`Erro ao criar comentário: ${err.response?.data?.erro || err.response?.data?.mensagem || err.message}`);
      }
    }
  };

  const deletarComentario = async (commentId) => {
    if (!window.confirm('Tem certeza que deseja excluir este comentário e suas respostas?')) return;

    try {
      let token = user?.token;
      if (!token && localStorage.getItem('token')) {
        try {
          token = JSON.parse(localStorage.getItem('token'));
        } catch (parseError) {
          token = localStorage.getItem('token');
        }
      }
      if (!token) {
        setError('Nenhum token de autenticação encontrado. Faça login novamente.');
        navigate('/login');
        return;
      }
      if (user?.tipo !== 'gestor') {
        setError('Apenas gestores podem excluir comentários.');
        return;
      }

      console.log(`Excluindo comentário com ID: ${commentId}`);
      await api.delete(`/comentarios/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await api.get(`/comentarios/publicacao/${postId}`);
      const hierarchicalComments = buildCommentHierarchy(res.data || []);
      setComments(hierarchicalComments);
      console.log('Comentários após exclusão:', JSON.stringify(hierarchicalComments, null, 2));
    } catch (err) {
      console.error('Erro ao excluir comentário:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        stack: err.stack,
      });
      setError(`Erro ao excluir comentário: ${err.response?.data?.mensagem || err.message}`);
    }
  };

  const CommentItem = ({ comment, level = 0 }) => {
    return (
      <li className={`comment-item level-${level}`} style={{ marginLeft: `${level * 20}px` }}>
        <div className="comment-content">
          <div className="comment-header">
            <strong>{comment.autor?.nome || 'Usuário Desconhecido'}</strong>
            <span className="comment-date">
              {new Date(comment.data_comentario).toLocaleString('pt-PT')}
            </span>
          </div>
          <div className="comment-text">{comment.descricao_comentario}</div>
          <button
            onClick={() => handleReply(comment.idcomentario)}
            className="reply-button"
          >
            Responder
          </button>
          {user?.tipo === 'gestor' && (
            <button
              onClick={() => deletarComentario(comment.idcomentario)}
              className="delete-button"
            >
              Excluir
            </button>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <ul className="replies-list">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.idcomentario}
                comment={reply}
                level={level + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  };

  if (!post) return <p>Carregando...</p>;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{post.titulo_publicacao}</h2>
        <p>{post.descricao_publicacao}</p>
        {post.anexos && post.anexos.length > 0 && (
          <div className="post-attachments">
            {post.anexos.map(anexo => (
              anexo.mimetype.startsWith('image/') ? (
                <img
                  key={anexo.idanexo_publicacao}
                  src={anexo.filename}
                  alt={anexo.nome_original}
                  className="post-attachment"
                />
              ) : (
                <a
                  key={anexo.idanexo_publicacao}
                  href={anexo.filename}
                  download={anexo.nome_original}
                  className="post-attachment-link"
                >
                  {anexo.nome_original}
                </a>
              )
            ))}
          </div>
        )}

        <h3>Comentários</h3>
        <ul className="comments-list">
          {comments.map(comment => (
            <CommentItem key={comment.idcomentario} comment={comment} level={0} />
          ))}
        </ul>

        <form onSubmit={adicionarComentario} className="comment-form" key={replyTarget}>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={parentId ? `Responder ao comentário...` : 'Adicionar comentário...'}
            maxLength={256}
          />
          <div className="form-actions">
            <button type="submit" className="btn-comment">Comentar</button>
            {parentId && (
              <button
                type="button"
                onClick={() => {
                  setParentId(null);
                  setReplyTarget(null);
                  setNewComment('');
                }}
                className="btn-cancel"
              >
                Cancelar resposta
              </button>
            )}
          </div>
        </form>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">Comentário adicionado com sucesso!</p>}
      </div>
    </div>
  );
}
