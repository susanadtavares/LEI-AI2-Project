import { useEffect, useState } from 'react';
import api from '../../../api';
import UtilizadorCard from '../../../components/UtilizadorCard';
import './AdminGestaoFormador.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

export default function AdminGestaoFormador() {
  const navigate = useNavigate();
  const [formadores, setFormadores] = useState([]);
  const [sortBy, setSortBy] = useState('nome');

  useEffect(() => {
    carregarFormadores();
  }, []);

  const carregarFormadores = () => {
    api.get('/formadores')
      .then(res => {
        if (Array.isArray(res.data)) setFormadores(res.data);
        else setFormadores([]);
      })
      .catch(() => setFormadores([]));
  };

  const ordenarFormadores = (lista) => {
    return [...lista].sort((a, b) => {
      if (sortBy === 'nome') {
        return (a.utilizador?.nome || '').localeCompare(b.utilizador?.nome || '');
      } else if (sortBy === 'data') {
        return new Date(a.data_inscricao) - new Date(b.data_inscricao);
      }
      return 0;
    });
  };

  const eliminarFormador = async (formador) => {
    if (window.confirm(`Deseja eliminar ${formador.utilizador?.nome || 'este formador'}?`)) {
      try {
        await api.delete(`/formadores/${formador.id_utilizador}/${formador.id_formador}`);
        carregarFormadores();
      } catch {
        /* noop */
      }
    }
  };

  const editarFormador = (formador) => {
    navigate(`/gestor/formadores/editar/${formador.id_utilizador}/${formador.id_formador}`);
  };

  return (
    <div className="gestao-formadores">
      {/* Header: título à esquerda + ações/ordenar à direita */}
      <div className="top-bar">
        <div className="top-bar-left">
          <h2>Gestão de Formadores</h2>
        </div>

        <div className="top-bar-right">
          {/* Botões */}
          <button
            className="btn btn-pendentes"
            onClick={() => navigate('/gestor/formadores-pendentes')}
            title="Pedidos pendentes"
          >
            <span className="material-symbols-outlined">pending_actions</span>
            <span>Pedidos pendentes</span>
          </button>

          <button
            className="btn btn-add"
            onClick={() => navigate('/gestor/formadores/novo')}
            title="Adicionar formador"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span>Adicionar formador</span>
          </button>

          {/* Ordenar (rótulo + pílula) – fica no “quadrado” à direita */}
          <div className="sort-control">
            <span className="sort-label">Ordenar por</span>
            <div className="sort-box">
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Ordenar formadores"
              >
                <option value="nome">Nome</option>
                <option value="data">Data de Inscrição</option>
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="sort-box-arrow" />
            </div>
          </div>
        </div>
      </div>

      {/* Barras: preta curta + cinzenta 100% */}
      <div className="header-rules" aria-hidden="true">
        <span className="rule-black"></span>
        <span className="rule-grey"></span>
      </div>

      <div className="formador-grid">
        {formadores.length > 0 ? (
          ordenarFormadores(formadores).map(f => (
            <UtilizadorCard
              key={`${f.id_utilizador}-${f.id_formador}`}
              data={f}
              tipo="formador"
              onDelete={() => eliminarFormador(f)}
              onEdit={() => editarFormador(f)}
              onViewPerfil={() =>
                navigate(`/formador/perfil/${f.id_utilizador}/${f.id_formador}`)
              }
            />
          ))
        ) : (
          <p>Nenhum formador encontrado.</p>
        )}
      </div>
    </div>
  );
}
