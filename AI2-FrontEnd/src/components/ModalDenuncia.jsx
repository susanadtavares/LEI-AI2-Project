import { useState } from 'react';
import api from '../api';

export default function ModalDenuncia({ postId, commentId, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      motivo,
    };
    if (postId) payload.id_publicacao = postId;
    if (commentId) payload.id_comentario = commentId;

    try {
      const response = await api.post('/denuncia', payload);
      
      if (response.data.sucesso) {
        alert('Denúncia enviada com sucesso!');
        onClose();
      }
    } catch (err) {
      console.error('Erro ao enviar denúncia:', err);
      setError(err.response?.data?.erro || 'Erro ao enviar denúncia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Denunciar {postId ? 'Publicação' : 'Comentário'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Motivo da denúncia:</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da denúncia..."
              rows="4"
              maxLength="255"
              required
            />
            <small>{motivo.length}/255 caracteres</small>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || !motivo.trim()}>
              {loading ? 'Enviando...' : 'Enviar Denúncia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}