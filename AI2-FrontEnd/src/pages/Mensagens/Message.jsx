import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Message.css';

export default function MensagensPage() {
  const [threads, setThreads] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) return;
    const fetchThreads = async () => {
      try {
        // ajusta o endpoint ao teu backend
        const { data } = await axios.get(`/api/mensagens/threads?userId=${user.id_utilizador}`);
        setThreads(data?.data || data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchThreads();
  }, [user]);

  const abrirThread = (threadId) => navigate(`/mensagens/${threadId}`);

  return (
    <div className="mensagens-page">
      <h2>Mensagens</h2>
      {threads.length === 0 ? (
        <p>Sem conversas ainda.</p>
      ) : (
        <ul className="threads-list">
          {threads.map(t => (
            <li key={t.id_thread} className="thread-item" onClick={() => abrirThread(t.id_thread)}>
              <div className="thread-avatar">{(t.nome_outro || '?').charAt(0)}</div>
              <div className="thread-main">
                <div className="thread-top">
                  <strong>{t.nome_outro}</strong>
                  <span className="thread-time">{new Date(t.updated_at || t.created_at).toLocaleString('pt-PT')}</span>
                </div>
                <div className="thread-last">{t.ultima_msg || '—'}</div>
              </div>
              {t.nao_lidas > 0 && <span className="badge">{t.nao_lidas}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
