import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faCamera, faPaperPlane, faPen } from "@fortawesome/free-solid-svg-icons";
import api from "../../../api";
import "./NovaAula.css";

export default function NovaAula() {
  const { id_curso } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [tipoUtilizador, setTipoUtilizador] = useState(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [video, setVideo] = useState(null);
  const [anexos, setAnexos] = useState([]);

  // carrega user/tipo
  useEffect(() => {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    if (!user?.tipo) return navigate("/login");
    setTipoUtilizador(user.tipo);
  }, [navigate]);

  // carrega dados do curso
  useEffect(() => {
    api
      .get(`/cursos/${id_curso}`)
      .then((res) => {
        const data = res?.data?.data ?? res?.data ?? null;
        setCurso(data);
      })
      .catch(() => setCurso(null));
  }, [id_curso]);

  const disabled = useMemo(
    () => !titulo.trim() || !descricao.trim(),
    [titulo, descricao]
  );

  function handlePickVideo(e) {
    const f = e.target.files?.[0];
    if (f) setVideo(f);
  }

  function handleAdicionarAnexo(e) {
    const f = e.target.files?.[0];
    if (f) setAnexos((prev) => [...prev, f]);
  }

  function removeAnexo(idx) {
    setAnexos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleLancar() {
    const formData = new FormData();
    formData.append("titulo_aula", titulo);
    formData.append("descricao_aula", descricao);
    formData.append("id_curso", id_curso);
    if (video) formData.append("video", video);
    anexos.forEach((f) => formData.append("anexos", f));

    try {
      await api.post("/aulas", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Aula lançada com sucesso!");
      navigate(`/${tipoUtilizador}/cursos/sincrono/${id_curso}`);
    } catch {
      alert("Erro ao lançar aula");
    }
  }

  if (!curso || !tipoUtilizador) return <p>Carregando…</p>;

  return (
    <div className="nova-aula">
      {/* breadcrumb topo */}
      <div className="na-breadcrumb">
        <div className="na-curso">{curso?.titulo ?? "Curso"}</div>
        <div className="na-formador">{curso?.nomeFormador ?? ""}</div>
      </div>

      {/* barra superior: título + lançar */}
      <div className="na-topbar">
        <div className="na-title-wrap">
          <div className="na-title-icon">
            <FontAwesomeIcon icon={faFileAlt} />
          </div>
          <input
            className="na-title-input"
            type="text"
            placeholder="Adicionar Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <button className="na-edit-ghost" type="button">
            <FontAwesomeIcon icon={faPen} />
          </button>
        </div>

        <button
          className="na-launch"
          onClick={handleLancar}
          disabled={disabled}
        >
          <FontAwesomeIcon icon={faPaperPlane} /> Lançar
        </button>
      </div>

      {/* bloco vídeo */}
      <label className="na-video" htmlFor="video-input">
        {!video ? (
          <div className="na-video-empty">
            <FontAwesomeIcon icon={faCamera} size="2x" />
            <div className="na-video-text">Adicionar Vídeo</div>
          </div>
        ) : (
          <div className="na-video-preview">
            <div className="na-video-name">{video.name}</div>
            <button
              className="na-remove"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setVideo(null);
              }}
            >
              Remover
            </button>
          </div>
        )}
        <input
          id="video-input"
          type="file"
          accept="video/*"
          hidden
          onChange={handlePickVideo}
        />
      </label>

      {/* descrição */}
      <textarea
        className="na-desc"
        placeholder="Adicionar Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      {/* anexos */}
      <div className="na-attachments">
        <div className="na-attachments-head">
          <span>Adicionar Anexos</span>
          <label className="na-add-file">
            + Adicionar
            <input type="file" hidden onChange={handleAdicionarAnexo} />
          </label>
        </div>

        <div className="na-attachments-grid">
          {anexos.map((f, i) => {
            const ext = (f.name.split(".").pop() || "").toUpperCase();
            return (
              <div key={i} className="na-attachment-card">
                <div className="na-attachment-thumb">
                  <FontAwesomeIcon icon={faFileAlt} />
                </div>
                <div className="na-attachment-meta">
                  <div className="na-attachment-name" title={f.name}>
                    {f.name}
                  </div>
                  <div className="na-attachment-ext">{ext || f.type}</div>
                </div>
                <button
                  className="na-remove na-remove-small"
                  type="button"
                  onClick={() => removeAnexo(i)}
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
