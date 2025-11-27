import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './ModalAddPost.css';

export default function ModalAddPost({ topicoId, area, onClose, onSuccess }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [anexos, setAnexos] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id_utilizador;

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxCounts = { imagens: 5, videos: 2, ficheiros: 5 };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const imagens = files.filter(f => f.type.startsWith('image/'));
    const videos = files.filter(f => f.type.startsWith('video/'));
    const ficheiros = files.filter(f => !f.type.startsWith('image/') && !f.type.startsWith('video/'));

    if (imagens.length > maxCounts.imagens) {
      setError(`Máximo de ${maxCounts.imagens} imagens permitidas.`);
      return;
    }
    if (videos.length > maxCounts.videos) {
      setError(`Máximo de ${maxCounts.videos} vídeos permitidos.`);
      return;
    }
    if (ficheiros.length > maxCounts.ficheiros) {
      setError(`Máximo de ${maxCounts.ficheiros} ficheiros permitidos.`);
      return;
    }
    if (files.some(f => f.size > maxFileSize)) {
      setError('Cada arquivo deve ter no máximo 10MB.');
      return;
    }

    console.log('Selected files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    setAnexos(files);
    setError(null);
  };

  const adicionarPost = async (e) => {
    e.preventDefault();

    if (!titulo.trim()) {
      setError('O título do post é obrigatório.');
      return;
    }

    if (!userId) {
      setError('Usuário não autenticado. Faça login novamente.');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('id_topico_forum', topicoId);
    formData.append('id_utilizador', userId);
    formData.append('titulo_publicacao', titulo);
    formData.append('descricao_publicacao', descricao);

    anexos.forEach(anexo => {
      if (anexo.type.startsWith('image/')) {
        formData.append('imagens', anexo);
      } else if (anexo.type.startsWith('video/')) {
        formData.append('videos', anexo);
      } else {
        formData.append('ficheiros', anexo);
      }
    });

    try {
      const response = await api.post('/publicacao', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Resposta da API:', response.data);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess(response.data);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Erro ao adicionar post:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.erro || err.message.includes('Multer') ? `Limite de arquivos excedido (máx: ${maxCounts.imagens} imagens, ${maxCounts.videos} vídeos, ${maxCounts.ficheiros} ficheiros)` : 'Erro ao criar o post. Tente novamente.';
      setError(errorMessage);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Adicionar Novo Post</h2>
        <button className="modal-close" onClick={onClose}>×</button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">Post criado com sucesso!</p>}
        <form onSubmit={adicionarPost} className="form-post">
          <input
            type="text"
            placeholder="Título do Post"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
          <textarea
            placeholder="Descrição do post (inclua links se necessário)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
          <input
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
          />
          {anexos.length > 0 && (
            <ul className="file-list">
              {anexos.map((file, index) => (
                <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
              ))}
            </ul>
          )}
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
