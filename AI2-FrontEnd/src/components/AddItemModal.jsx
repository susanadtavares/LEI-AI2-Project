import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import api from '../api';
import './AddItemModal.css';

const AddItemModal = ({ isOpen, onClose, type, parentId, parentName, onSuccess }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const itemTypes = {
    categoria: { label: 'Categoria', endpoint: '/categorias' },
    area: { label: 'Área', endpoint: '/areas' },
    topico: { label: 'Tópico', endpoint: '/topicos' },
  };

  useEffect(() => {
    console.log('Modal isOpen:', isOpen); 
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
      console.log('Modal rendered, focus set to close button'); 
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const onlyLettersRegex = /^[A-Za-zÀ-ÿ\s]+$/;
    if (!name.trim()) {
      setError(`O nome do ${itemTypes[type].label.toLowerCase()} é obrigatório.`);
      setIsSubmitting(false);
      return;
    }
    if (!onlyLettersRegex.test(name)) {
      setError(`O nome do ${itemTypes[type].label.toLowerCase()} deve conter apenas letras.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = type === 'categoria' ? { nome_categoria: name } :
                      type === 'area' ? { nome_area: name, id_categoria: parentId } :
                      { nome_topico: name, id_area: parentId };

      console.log('Submitting payload:', payload); 
      const response = await api.post(itemTypes[type].endpoint, payload);
      if (response.data.sucesso) {
        onSuccess();
        setName('');
        onClose();
      } else {
        setError(response.data.mensagem || `Erro ao criar ${itemTypes[type].label.toLowerCase()}.`);
      }
    } catch (err) {
      console.error('Submission error:', err); 
      setError(err.response?.data?.mensagem || `Erro ao criar ${itemTypes[type].label.toLowerCase()}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-labelledby="modal-title" aria-modal="true">
      <div className="modal-content" ref={modalRef}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Fechar modal"
          ref={firstFocusableRef}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h2 id="modal-title">Adicionar {itemTypes[type].label}</h2>
        {parentName && (
          <p>Associado a: <strong>{parentName}</strong></p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome do {itemTypes[type].label}</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Digite o nome do ${itemTypes[type].label.toLowerCase()}`}
              disabled={isSubmitting}
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>
          {error && <p id="error-message" className="error-message">{error}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cancelar"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
              aria-label={`Criar ${itemTypes[type].label.toLowerCase()}`}
            >
              {isSubmitting ? 'A criar...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;