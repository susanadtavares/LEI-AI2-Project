import './UtilizadorCard.css';
import UtilizadorActionsMenu from './UtilizadorActionsMenu';

export default function UtilizadorCard({ data, tipo, onDelete, onEdit, onViewPerfil }) {

  if (!data) {
    console.error('Data or utilizador is undefined in UtilizadorCard:', data);
    return null;
  }

  return (
    <div className="utilizador-card" onClick={onViewPerfil}>
      <div className="card-menu " onClick={(e) => e.stopPropagation()}>
        <UtilizadorActionsMenu data={data} tipo={tipo} onDelete={onDelete} onEdit={onEdit} />
      </div>
      <img
        src={data.foto_perfil || 'https://res.cloudinary.com/di4up9s9u/image/upload/v1755691191/e_bkyeot.png'}
        alt={data.utilizador.nome || 'Unknown'}
        className="utilizador-avatar"
      />
      <h4 onClick={onViewPerfil} style={{ cursor: 'pointer' }}>{data.utilizador.nome || 'Sem nome'}</h4>
      <p className="email-text">{data.utilizador.email || 'Sem email'}</p>
    </div>
  );
}