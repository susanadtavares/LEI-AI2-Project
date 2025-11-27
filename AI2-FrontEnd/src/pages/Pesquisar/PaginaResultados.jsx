import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function PaginaResultados() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [carregar, setCarregar] = useState(true);

  const termo = searchParams.get('q');

  useEffect(() => {
    const fetchResultados = async () => {
      try {
        const res = await api.get('/search/search', {
          params: { q: termo }
        });
        setResultados(res.data);
      } catch (err) {
        console.error('Erro a obter resultados:', err);
      } finally {
        setCarregar(false);
      }
    };

    if (termo && termo.trim()) {
      fetchResultados();
    } else {
      setCarregar(false);
      setResultados([]);
    }
  }, [termo]);

  const irParaDestino = (item) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const tipo = user?.tipo;

    const id_util = item.id_utilizador ?? item.idUser ?? item.user_id;
    const id_formador = item.id_formador ?? item.id;
    const id_formando = item.id_formando ?? item.id;
    const id_curso = item.id_curso ?? item.id;

    switch (item.tipo) {
      case 'formador':
        if (id_util && id_formador) {
          navigate(`/formador/perfil/${id_util}/${id_formador}`);
        } else {
          alert("Dados de formador incompletos.");
        }
        break;

      case 'formando':
        if (id_util && id_formando) {
          navigate(`/formando/perfil/${id_util}/${id_formando}`);
        } else {
          alert("Dados de formando incompletos.");
        }
        break;

      case 'gestor':
        navigate(`/gestor/perfil/${item.id ?? ''}`);
        break;

      case 'curso':
        if (!tipo) {
          alert('Utilizador não autenticado.');
          return;
        }
        if (!id_curso) {
          alert('Curso sem ID.');
          return;
        }
        if (tipo === 'formador') navigate(`/formador/cursos/${id_curso}`);
        else if (tipo === 'gestor') navigate(`/gestor/cursos/${id_curso}`);
        else if (tipo === 'formando') navigate(`/formando/cursos/${id_curso}`);
        else alert('Tipo de utilizador inválido.');
        break;

      default:
        console.warn('Tipo desconhecido:', item.tipo);
    }
  };

  const getDisplayText = (item) => {
    return item.nome || item.titulo || 'Sem nome';
  };

  const getStableKey = (item) => {
    const id =
      item.id ??
      item.id_curso ??
      item.id_formador ??
      item.id_formando ??
      item.id_utilizador ??
      Math.random();
    return `${item.tipo}-${id}`;
  };

  const renderItem = (item) => (
    <div
      key={getStableKey(item)}
      onClick={() => irParaDestino(item)}
      style={{
        border: '1px solid #ccc',
        padding: '1rem',
        margin: '0.5rem 0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
    >
      <strong>{getDisplayText(item)}</strong>{' '}
      <span style={{ color: '#555' }}>({item.tipo})</span>
    </div>
  );

  if (!termo || !termo.trim()) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Pesquisa</h2>
        <p>Por favor, introduza um termo de pesquisa.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '2rem' }}>
        <h2>Resultados para: <em>"{termo}"</em></h2>
        {carregar ? (
          <p>A carregar...</p>
        ) : resultados.length === 0 ? (
          <p>Sem resultados encontrados para "{termo}".</p>
        ) : (
          <div>
            {['formador', 'formando', 'gestor'].some(t => resultados.some(r => r.tipo === t)) && (
              <>
                <h3>Utilizadores ({resultados.filter(r => ['formador', 'formando', 'gestor'].includes(r.tipo)).length})</h3>
                {resultados
                  .filter(r => ['formador', 'formando', 'gestor'].includes(r.tipo))
                  .map(renderItem)}
              </>
            )}

            {resultados.some(r => r.tipo === 'curso') && (
              <>
                <h3>Cursos ({resultados.filter(r => r.tipo === 'curso').length})</h3>
                {resultados.filter(r => r.tipo === 'curso').map(renderItem)}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
