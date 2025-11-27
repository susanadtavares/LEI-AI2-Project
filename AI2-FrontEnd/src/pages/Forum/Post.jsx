import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate} from 'react-router-dom';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Post.css';

export default function Post() {

  const location = useLocation();
  const navigate = useNavigate();


  const { topicoId } = useParams(); 
  const [posts, setPosts] = useState([]);
  const [topico, setTopico] = useState(null);
  const [links, setLinks] = useState([]);
  const categoriaSelecionada = location.state?.categoria;

  //links
  function linkify(text) {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      return part;
    });
  }

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await axios.get(`/api/publicacao?id_topico=${topicoId}`);
        console.log('Posts recebidos:', res.data);
        setPosts(res.data);
      } catch (err) {
        console.error('Erro encontrar posts:', err);
      }
    }

    async function fetchTopico() {
      try {
        const res = await axios.get(`/api/topicos/${topicoId}`);
        setTopico(res.data);
      } catch (err) {
        console.error('Erro ao buscar tópico:', err);
      }
    }

    fetchPosts();
    fetchTopico();
  }, [topicoId]);

  return (
    <div className="pagina-posts">
        <aside className="sidebar">
  <div className="categoria-item ativo">
    <span className="nome">
      {categoriaSelecionada?.nome_categoria || 'Categoria não definida'}
    </span>
  </div>
</aside>
        <main className="conteudo-principal">
      <h1>{topico?.nome_topico || 'A carregar...'}</h1>
        <button
    className="btn-add-post"
    title="Adicionar Post"
    onClick={() => navigate(`/gestor/forum/adicionar-post/${topicoId}`)}
  >
    + Criar Post
  </button>
      {posts.length === 0 ? (
        <p>Este tópico ainda não tem posts.</p>
        
      ) : (
        <ul className="lista-posts">
          {posts.map(post => (
            <li key={post.id_publicacao}>
              <strong>{post.titulo_publicacao}</strong>
              <p>{linkify(post.descricao_publicacao)}</p>
              {post.anexos?.length > 0 && (
                  <div className="anexos">
                    {post.anexos.map(a => (
                      a.mimetype.startsWith('image/') 
                        ? <img
                            key={a.idanexo_publicacao}
                            src={`/uploads/${a.filename}`}
                            alt={a.nome_original}
                            style={{ maxWidth: '200px', margin: '0.5rem' }}
                          />
                        : <a
                            key={a.idanexo_publicacao}
                            href={`/uploads/${a.filename}`}
                            download={a.nome_original}
                            style={{ display: 'block', margin: '0.5rem 0' }}
                          >
                             {a.nome_original}
                          </a>
                    ))}
                  </div>
                )}
            </li>
          ))}
        </ul>
      )}
      
    </main>
    </div>
  );
}
