// pages/Admin/OpCursos/NovoTesteModal.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faFileCirclePlus,
  faCheck,
  faNoteSticky,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import api from '../../../api';
import './NovoTesteModal.css';

export default function NovoTesteModal({ open, onClose, id_curso, curso, onCreated }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [ficheiro, setFicheiro] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState('');
  const fileRef = useRef(null);

  // Bloqueia scroll e fecha com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Limites de data (amanhã e ≤ fim do curso, se existir)
  const minDate = useMemo(
    () => new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    []
  );
  const maxDate = useMemo(() => {
    if (!curso?.data_fim) return '';
    return new Date(curso.data_fim).toISOString().slice(0, 10);
  }, [curso?.data_fim]);

  const canSubmit = useMemo(
    () => titulo.trim() && descricao.trim() && dataEntrega && ficheiro && !submitting,
    [titulo, descricao, dataEntrega, ficheiro, submitting]
  );

  if (!open) return null;

  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setErro('Por favor selecione um ficheiro PDF.');
      e.target.value = '';
      return;
    }
    setErro('');
    setFicheiro(f);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!canSubmit) return;

    setSubmitting(true);
    setErro('');
    try {
      const fd = new FormData();
      fd.append('id_curso', id_curso);
      fd.append('titulo_teste', titulo.trim());
      fd.append('descricao_teste', descricao.trim());
      fd.append('dataentrega_teste', dataEntrega); // YYYY-MM-DD
      fd.append('anexo_teste', ficheiro);          // PDF

      const res = await api.post('/testes', fd);   // não forces Content-Type
      onCreated?.(res.data);                       // injeta no Curso.jsx
      // Limpa o formulário (caso reabras o modal)
      setTitulo('');
      setDescricao('');
      setDataEntrega('');
      setFicheiro(null);
    } catch (err) {
      const msg = err?.response?.data?.erro || 'Erro ao adicionar teste';
      setErro(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ntm" role="dialog" aria-modal="true" aria-labelledby="ntm-title">
      <div className="ntm__backdrop" onClick={onClose} />
      <div className="ntm__card">
        <div className="ntm__header">
          <div className="ntm__title" id="ntm-title">Novo Teste</div>
          <button className="ntm__close" onClick={onClose} aria-label="Fechar">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form className="ntm__body" onSubmit={handleSubmit}>
          {/* título */}
          <div className="ntm__row">
            <div className="ntm__icon" aria-hidden>
              <FontAwesomeIcon icon={faNoteSticky} />
            </div>
            <div className="ntm__titleWrap">
              <input
                className="ntm__input"
                placeholder="Adicionar Título"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
              <span className="ntm__edit" aria-hidden>
                <FontAwesomeIcon icon={faPen} />
              </span>
            </div>
          </div>

          {/* descrição */}
          <textarea
            className="ntm__textarea"
            placeholder="Adicionar Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />

          {/* data */}
          <input
            className="ntm__date"
            type="date"
            value={dataEntrega}
            onChange={(e) => setDataEntrega(e.target.value)}
            min={minDate}
            max={maxDate}
            required
          />

          {/* ficheiro */}
          <div className="ntm__file">
            <button type="button" className="ntm__pick" onClick={() => fileRef.current?.click()}>
              <FontAwesomeIcon icon={faFileCirclePlus} /> Selecionar PDF
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={onPickFile}
            />
            {ficheiro && (
              <div className="ntm__filename" title={ficheiro.name}>
                {ficheiro.name}
              </div>
            )}
          </div>

          {!!erro && <div className="ntm__error">{erro}</div>}

          <div className="ntm__footer">
            <button type="button" className="ntm__ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="ntm__primary" disabled={!canSubmit}>
              <FontAwesomeIcon icon={faCheck} /> {submitting ? 'A enviar…' : 'Concluir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
