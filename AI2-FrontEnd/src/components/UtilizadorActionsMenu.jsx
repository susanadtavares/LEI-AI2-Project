import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import './UtilizadorActionsMenu.css';

export default function UtilizadorActionsMenu({ data, tipo, onDelete, onEdit }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector('button[role="menuitem"]');
      first?.focus();
    }
  }, [open]);

  const handleEditInternal = () => {
    const pluralTipos = { formando: 'formandos', formador: 'formadores' };
    const pluralTipo = pluralTipos[tipo] || `${tipo}s`;
    navigate(`/gestor/${pluralTipo}/editar/${data.id_utilizador}/${data[`id_${tipo}`]}`);
  };

  const handleMenuKeyDown = (e) => {
    if (!menuRef.current) return;
    const items = Array.from(menuRef.current.querySelectorAll('button[role="menuitem"]'));
    const currentIndex = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="actions-menu" ref={containerRef}>
      <button
        type="button"
        className="menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menu de ações"
        onClick={() => setOpen((v) => !v)}
      >
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="utilizador-actions-menu"
          role="menu"
          onKeyDown={handleMenuKeyDown}
        >
          <button
            type="button"
            role="menuitem"
            onClick={onEdit || handleEditInternal}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            <span>Editar</span>
          </button>

          <button type="button" role="menuitem" onClick={onDelete} className="danger">
  <FontAwesomeIcon icon={faTrash} />
  <span>Remover</span>
</button>
        </div>
      )}
    </div>
  );
}
