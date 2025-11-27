import { useState, useEffect } from 'react';
import './FormandoModal.css';

export default function FormandoModal({ open, onClose, onSave, formando }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (formando) {
      setFormData(formando);
    }
  }, [formando]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <form className="formando-modal" onSubmit={handleSubmit}>
        <h2>{formando ? 'Editar' : 'Adicionar'} Formando</h2>

        <div className="form-row">
          <input type="text" name="nome" placeholder="Nome" value={formData.nome || ''} onChange={handleChange} required />
          <input type="text" name="email" placeholder="Email" value={formData.email || ''} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <input type="password" name="palavra_passe" placeholder="Palavra-passe" value={formData.palavra_passe || ''} onChange={handleChange} required />
          <input type="text" name="telemovel" placeholder="Telemóvel" value={formData.telemovel || ''} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <input type="date" name="data_nascimento" value={formData.data_nascimento || ''} onChange={handleChange} required />
          <select name="genero" value={formData.genero || ''} onChange={handleChange}>
            <option value="">Género</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>

        <div className="form-row">
          <input type="number" name="n_cursosacabados" placeholder="Cursos Concluídos" value={formData.n_cursosacabados || 0} onChange={handleChange} />
          <input type="number" name="n_cursosinscritos" placeholder="Cursos Inscritos" value={formData.n_cursosinscritos || 0} onChange={handleChange} />
        </div>

        <textarea name="descricao_formando" placeholder="Descrição" value={formData.descricao_formando || ''} onChange={handleChange}></textarea>
        <textarea name="educacao_formando" placeholder="Educação" value={formData.educacao_formando || ''} onChange={handleChange}></textarea>
        <textarea name="habilidades_formando" placeholder="Habilidades" value={formData.habilidades_formando || ''} onChange={handleChange}></textarea>
        <textarea name="certificacoes_formando" placeholder="Certificações" value={formData.certificacoes_formando || ''} onChange={handleChange}></textarea>

        <div className="form-buttons">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>
    </div>
  );
}
