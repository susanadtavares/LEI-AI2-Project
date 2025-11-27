import { useEffect, useState } from 'react';
import api from '../../../api';
import UtilizadorCard from '../../../components/UtilizadorCard';
import './AdminGestaoFormandos.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

export default function AdminGestaoFormandos() {
  const navigate = useNavigate();
  const [formandos, setFormandos] = useState([]);
  const [sortBy, setSortBy] = useState('nome');

  useEffect(() => {
    carregarFormandos();
  }, []);

  const carregarFormandos = () => {
    api.get('/formandos')
      .then(res => {
        if (Array.isArray(res.data)) setFormandos(res.data);
        else setFormandos([]);
      })
      .catch(() => setFormandos([]));
  };

  const ordenarFormandos = (lista) => {
    return [...lista].sort((a, b) => {
      if (sortBy === 'nome') {
        return (a.utilizador?.nome || '').localeCompare(b.utilizador?.nome || '');
      }
      if (sortBy === 'data') {
        return new Date(a.data_inscricao) - new Date(b.data_inscricao);
      }
      return 0;
    });
  };

  const eliminarFormando = async (f) => {
    if (window.confirm(`Deseja eliminar ${f.utilizador?.nome || 'este formando'}?`)) {
      try {
        await api.delete(`/formandos/${f.id_utilizador}/${f.id_formando}`);
        carregarFormandos();
      } catch { /* noop */ }
    }
  };

  const editarFormando = (f) => {
    navigate(`/gestor/formandos/editar/${f.id_utilizador}/${f.id_formando}`);
  };

  return (
    <div className="gf-page">
      {/* Header: título à esquerda + ações à direita */}
      <div className="gf-top">
        <div className="gf-top-left">
          <h2 className="gf-title">Gestão de Formandos</h2>
        </div>

        <div className="gf-top-right">
          {/* Botão: pedidos pendentes */}
          <button
            type="button"
            className="gf-chip"
            onClick={() => navigate('/gestor/formandos-pendentes')}
            title="Pedidos pendentes"
          >
            <span className="material-symbols-outlined">pending_actions</span>
            <span>Pedidos pendentes</span>
          </button>

          {/* Botão: adicionar formando */}
          <button
            type="button"
            className="gf-chip"
            onClick={() => navigate('/gestor/formandos/novo')}
            title="Adicionar formando"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span>Adicionar formando</span>
          </button>

          {/* Ordenar por (igual ao outro e com as mesmas opções) */}
          <div className="gf-sort">
            <span className="gf-sort-label">Ordenar por</span>
            <div className="gf-sort-box">
              <select
                className="gf-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Ordenar formandos"
              >
                <option value="nome">Nome</option>
                <option value="data">Data de Inscrição</option>
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="gf-sort-arrow" />
            </div>
          </div>
        </div>
      </div>

      {/* Barras: preta curta + cinzenta full (encostadas ao título) */}
      <div className="gf-rules" aria-hidden="true">
        <span className="gf-rule-black"></span>
        <span className="gf-rule-grey"></span>
      </div>

      {/* Grid dos cartões – classe isolada desta página */}
      <div className="gf-grid">
        {formandos.length > 0 ? (
          ordenarFormandos(formandos).map(f => (
            <UtilizadorCard
              key={`${f.id_utilizador}-${f.id_formando}`}
              data={f}
              tipo="formando"
              onDelete={() => eliminarFormando(f)}
              onEdit={() => editarFormando(f)}
              onViewPerfil={() =>
                navigate(`/formando/perfil/${f.id_utilizador}/${f.id_formando}`)
              }
            />
          ))
        ) : (
          <p>Nenhum formando encontrado.</p>
        )}
      </div>
    </div>
  );
}
