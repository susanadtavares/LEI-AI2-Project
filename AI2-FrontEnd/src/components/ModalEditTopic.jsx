import { useState, useEffect } from 'react';
import api from '../api';
import './ModalEditTopic.css';

export default function ModalEditTopic({ topicoId, area, onClose, onSuccess }) {
  const [nomeTopico, setNomeTopico] = useState('');
  const [descricaoTopico, setDescricaoTopico] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTopico = async () => {
      try {
        const res = await api.get(`/topicos-forum/${topicoId}`);
        const topicoData = res.data.data || res.data;
        setNomeTopico(topicoData.titulo_topico || '');
        setDescricaoTopico(topicoData.descricao_topico || '');
      } catch (err) {
        console.error('Erro ao carregar tópico:', err);
        setError('Erro ao carregar dados do tópico.');
      } finally {
        setLoading(false);
      }
    };
    carregarTopico();
  }, [topicoId]);

  const atualizarTopico = async (e) => {
    e.preventDefault();
    if (!nomeTopico.trim()) {
      setError('O título do tópico é obrigatório.');
      return;
    }

    try {
      await api.put(`/topicos-forum/${topicoId}`, {
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
      console.error('Erro ao atualizar tópico:', err);
      setError('Erro ao atualizar o tópico. Tente novamente.');
    }
  };

  if (loading) return <p className="loading">Carregando...</p>;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Tópico</h2>
        <button className="modal-close" onClick={onClose}>×</button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">Tópico atualizado com sucesso!</p>}
        <form onSubmit={atualizarTopico} className="form-topico">
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