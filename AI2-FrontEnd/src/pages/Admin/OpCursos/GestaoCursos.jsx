import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseCard from '../../../components/CourseCardAdmin';
import './GestaoCursos.css';
import api from '../../../api';

export default function GestaoCursos() {
  const [cursos, setCursos] = useState([]);
  const [sortKey, setSortKey] = useState('data'); // 'nome' | 'data' | 'duracao' | 'formador' | 'tipo'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/cursos')
      .then(res => setCursos(res.data))
      .catch(err => console.error('Erro ao carregar cursos:', err));
  }, []);

  // helpers
  function getDataAdicao(c) {
    const d = c?.createdAt || c?.data_criacao || c?.dataCriacao || c?.data_inicio || null;
    return d ? new Date(d).getTime() : 0;
  }
  function getDuracaoHoras(c) {
    if (c?.duracao != null) return Number(c.duracao) || 0;
    if (c?.data_inicio && c?.data_fim) {
      const di = new Date(c.data_inicio).getTime();
      const df = new Date(c.data_fim).getTime();
      const ms = df - di;
      return ms > 0 ? Math.round(ms / (1000 * 60 * 60)) : 0;
    }
    return 0;
  }
  function getFormadorTuple(c) {
    const raw = (c?.nomeFormador || '').trim();
    const hasName = raw && raw.toLowerCase() !== 'sem formador';
    // 0 = tem nome válido → vem primeiro; 1 = vazio/"Sem formador" → fica no fim
    return [hasName ? 0 : 1, raw.toLowerCase()];
  }

  const sortedCursos = useMemo(() => {
    const list = [...cursos];
    const dir = sortDir === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      switch (sortKey) {
        case 'nome':
          return dir * String(a?.titulo || '').localeCompare(String(b?.titulo || ''), 'pt', { sensitivity: 'base' });
        case 'data':
          return dir * (getDataAdicao(a) - getDataAdicao(b));
        case 'duracao':
          return dir * (getDuracaoHoras(a) - getDuracaoHoras(b));
        case 'formador': {
          const [aHas, aName] = getFormadorTuple(a);
          const [bHas, bName] = getFormadorTuple(b);
          if (aHas !== bHas) return aHas - bHas; // vazios no fim
          return dir * aName.localeCompare(bName, 'pt', { sensitivity: 'base' });
        }
        case 'tipo':
          return dir * String(a?.tipo || '').localeCompare(String(b?.tipo || ''), 'pt', { sensitivity: 'base' });
        default:
          return 0;
      }
    });

    return list;
  }, [cursos, sortKey, sortDir]);

  return (
    <div>
      <div className="gestao-cursos">
        <div className="gestao-cursos-header">
          <h2>Gestão de Cursos</h2>

          <div className="header-actions">
            {/* Pílula de ordenação */}
            <div className="sort-pill" role="group" aria-label="Ordenar">
                <button
                type="button"
                className={`sort-chip ${sortKey === 'nome' ? 'active' : ''}`}
                aria-pressed={sortKey === 'nome'}
                onClick={() => setSortKey('nome')}
                title="Ordenar por nome"
                >
                <span className="material-symbols-outlined">text_fields</span>
                </button>

                <button
                type="button"
                className={`sort-chip ${sortKey === 'data' ? 'active' : ''}`}
                aria-pressed={sortKey === 'data'}
                onClick={() => setSortKey('data')}
                title="Ordenar por data de adição"
                >
                <span className="material-symbols-outlined">calendar_month</span>
                </button>

                <button
                type="button"
                className={`sort-chip ${sortKey === 'duracao' ? 'active' : ''}`}
                aria-pressed={sortKey === 'duracao'}
                onClick={() => setSortKey('duracao')}
                title="Ordenar por duração"
                >
                <span className="material-symbols-outlined">timer</span>
                </button>

                <button
                type="button"
                className={`sort-chip ${sortKey === 'formador' ? 'active' : ''}`}
                aria-pressed={sortKey === 'formador'}
                onClick={() => setSortKey('formador')}
                title="Ordenar por formador"
                >
                <span className="material-symbols-outlined">person</span>
                </button>

                <button
                type="button"
                className={`sort-chip ${sortKey === 'tipo' ? 'active' : ''}`}
                aria-pressed={sortKey === 'tipo'}
                onClick={() => setSortKey('tipo')}
                title="Ordenar por tipo"
                >
                <span className="material-symbols-outlined">category</span>
                </button>

                <span className="sort-divider" aria-hidden />

                <button
                type="button"
                className="sort-dir"
                onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
                title={sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
                >
                <span className="material-symbols-outlined">
                    {sortDir === 'asc' ? 'south' : 'north'}
                </span>
                </button>
            </div>

            <button
                className="add-curso-btn"
                onClick={() => navigate('/gestor/cursos/adicionar')}
                title="Adicionar curso"
            >
                <span className="material-symbols-outlined">add</span>
            </button>
            </div>
        </div>

        <div className="gestao-cursos-grid">
          {sortedCursos.length > 0 ? (
            sortedCursos.map((curso) => (
              <CourseCard key={curso.id_curso} curso={curso} />
            ))
          ) : (
            <p>Sem cursos disponíveis.</p>
          )}
        </div>
      </div>
    </div>
  );
}
