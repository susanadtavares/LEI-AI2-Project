import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Chat.css';

export default function ChatPage() {
  const { threadId } = useParams();
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // carregar mensagens
  const loadMensagens = async () => {
    try {
      const { data } = await axios.get(`/api/mensagens/${threadId}`);
      setMensagens(data?.data || data || []);
      // marca como lidas no backend
      await axios.post(`/api/mensagens/${threadId}/read`, { userId: user?.id_utilizador }).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!threadId) return;
    loadMensagens();
    const i = setInterval(loadMensagens, 3000); // polling simples
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviar = async (e) => {
    e.preventDefault();
    const texto = input.trim();
    if (!texto) return;
    setInput('');
    try {
      await axios.post(`/api/mensagens/${threadId}`, {
        de: user?.id_utilizador,
        texto
      });
      await loadMensagens();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="voltar" onClick={() => navigate('/mensagens')}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h3>Conversa</h3>
      </div>

      <div className="chat-body">
        {mensagens.map((m) => (
          <div
            key={m.id_mensagem || m.id}
            className={`msg-row ${m.de === user?.id_utilizador ? 'eu' : 'outro'}`}
          >
            <div className="msg-bubble">
              <div className="msg-text">{m.texto}</div>
              <div className="msg-time">{new Date(m.data || m.created_at).toLocaleTimeString('pt-PT')}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={enviar}>
        <input
          type="text"
          placeholder="Escreve uma mensagem…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" title="Enviar">
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  );
}
