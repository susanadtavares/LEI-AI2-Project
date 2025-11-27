import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api';
import './DetalhesAula.css';

export default function DetalhesAula() {
  const { id_aula } = useParams();
  const [aula, setAula] = useState(null);
  const navigate = useNavigate();

  const tipoUtilizador = JSON.parse(localStorage.getItem('user'))?.tipo;
  console.log('🔐 Tipo de utilizador (localStorage):', tipoUtilizador);
  console.log('🔍 ID da aula:', id_aula);

  useEffect(() => {
    api.get(`/aulas/${id_aula}`)
      .then(res => {
        console.log('📥 Aula recebida da API:', res.data);
        setAula(res.data);
      })
      .catch(err => console.error('❌ Erro ao carregar aula:', err));
  }, [id_aula]);

  if (!aula) return <p>Carregando aula...</p>;

  return (
    <div className="pagina-detalhes-aula">
      <div className="barra-topo">
        <h2>{aula.titulo_aula}</h2>
        <p>{formatarData(aula.data)}</p>
      </div>

      <div className="detalhes-aula-container">
        {/* Cabeçalho com botão Editar à direita */}
        <div className="cabecalho-aula">
          <div className="esquerda">
            <div className="icone">🖼️</div>
            <div className="titulo-info">
              <h1>{aula.titulo_aula}</h1>
              <p>{formatarData(aula.data)}</p>
            </div>
          </div>

          {(tipoUtilizador === 'gestor' || tipoUtilizador === 'formador') && (
            <div className="editar-direita">
              <button onClick={() => navigate(`/gestor/cursos/aulas/editar/${id_aula}`)}>
                ✎ Editar
              </button>
            </div>
          )}
        </div>

        {/* Vídeo */}
        <div className="video-frame">
          {aula.url_video ? (
            <video controls>
              <source src={`/uploads/${aula.url_video}`} type="video/mp4" />
              O seu navegador não suporta vídeo.
            </video>
          ) : (
            <p>Adicionar Vídeo</p>
          )}
        </div>

        {/* Descrição */}
        <div className="descricao-aula">
          {aula.descricao_aula?.split('\n').map((linha, index) => (
            <p key={index}>
              {linha.split(' ').map((word, i) =>
                word.startsWith('http') ? (
                  <a key={i} href={word} target="_blank" rel="noopener noreferrer">{word}</a>
                ) : (
                  <span key={i}> {word} </span>
                )
              )}
            </p>
          ))}
        </div>

        {/* Anexos */}
        <div className="anexos-section">
          <h4>Abaixo encontram-se disponíveis anexos relacionados à aula {aula.titulo_aula.split(' ')[1]}.</h4>
          {(aula.anexos || []).map((anexo, index) => (
            <div key={index} className="anexo-card">
              <img src="/assets/pdf-icon.png" alt="icon" />
              <div className="info">
                <span>{anexo.nome}</span>
                <span>{anexo.tipo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  return d.toLocaleDateString('pt-PT');
}
