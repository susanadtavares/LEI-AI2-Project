import { useState } from 'react';
import api from '../api';
import './ModalAddTopic.css';

export default function ModalAddTopic({ area, onClose, onSuccess }) {
  const [nomeTopico, setNomeTopico] = useState('');
  const [descricaoTopico, setDescricaoTopico] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const adicionarTopico = async (e) => {
    e.preventDefault();
    if (!nomeTopico.trim()) {
      setError('O título do tópico é obrigatório.');
      return;
    }

    try {
      await api.post('/topicos-forum', {
        id_area: area.id_area,
        titulo_topico: nomeTopico,
        descricao_topico: descricaoTopico,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Erro ao adicionar tópico:', err);
      setError('Erro ao criar o tópico. Tente novamente.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Criar Novo Tópico</h2>
        <button className="modal-close" onClick={onClose}>×</button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">Tópico criado com sucesso!</p>}
        <form onSubmit={adicionarTopico} className="form-topico">
          <input
            type="text"
            placeholder="Título do Tópico"
            value={nomeTopico}
            onChange={(e) => setNomeTopico(e.target.value)}
            required
          />
          <textarea
            placeholder="Descrição do tópico"
            value={descricaoTopico}
            onChange={(e) => setDescricaoTopico(e.target.value)}
            required
          />
          <div className="botoes-form">
            <button type="submit" className="btn-confirmar">Guardar</button>
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}