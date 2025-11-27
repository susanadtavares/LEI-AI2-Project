import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api";
import "../OpCursos/DetalhesCursos.css";
import "./UpdateCurso.inline.css";

// Font Awesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faLock, faUnlock } from "@fortawesome/free-solid-svg-icons";

const DEFAULT_IMAGE_URL =
  "https://res.cloudinary.com/di4up9s9u/image/upload/v1755604007/defaultcurso_w0zceo.png";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:3001";

function buildThumbUrl(curso) {
  const src =
    curso?.tumbnail ||
    curso?.thumbnail ||
    curso?.imagem_url ||
    curso?.url_imagem ||
    curso?.foto_curso ||
    "";
  if (!src) return DEFAULT_IMAGE_URL;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return `${API_BASE}${src}`;
  if (src.startsWith("uploads/")) return `${API_BASE}/${src}`;
  return `${API_BASE}/uploads/${src}`;
}

export default function UpdateCurso() {
  const { id_curso } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [imagem, setImagem] = useState(null);

  // opções e seleção (apenas leitura no update, mas mostramos)
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [sel, setSel] = useState({ id_categoria: null, id_area: null, id_topico: null });

  const [allAreas, setAllAreas] = useState([]);
  const [allTopicos, setAllTopicos] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingTopicos, setLoadingTopicos] = useState(false);

  // estados de edição (descrição começa EDITÁVEL)
  const [edit, setEdit] = useState({
    titulo: true,
    intro: true,
    datas: false,        // bloqueado pelo backend
    inscricao: true,     // só para síncronos (data_limite_inscricao)
    vagas: true,         // só para síncronos (maxVagas)
    tipo: false,         // bloqueado pelo backend
    descricao: true,     // COMEÇA EDITÁVEL
    taxonomia: false,    // id_categoria/id_area/id_topico bloqueados
  });

  // Carregar curso
  useEffect(() => {
    api.get(`/cursos/${id_curso}`)
      .then(res => setCurso(res?.data?.data ?? res.data))
      .catch(() => setCurso(null));
  }, [id_curso]);

  // Carregar listas (read-only)
  useEffect(() => {
    (async () => {
      try {
        const [catRes, aRes, tRes] = await Promise.all([
          api.get("/categorias"),
          api.get("/areas"),
          api.get("/topicos"),
        ]);
        setCategorias(catRes?.data?.data ?? catRes.data ?? []);
        const arrA = aRes?.data?.data ?? aRes.data ?? [];
        const arrT = tRes?.data?.data ?? tRes.data ?? [];
        setAllAreas(arrA);
        setAllTopicos(arrT);
      } catch (e) {
        console.error("Erro a carregar categorias/áreas/tópicos:", e);
      }
    })();
  }, []);

  // Preencher seleção com base no curso
  useEffect(() => {
    if (!curso) return;

    const next = {
      id_categoria: curso.id_categoria ?? null,
      id_area: curso.id_area ?? null,
      id_topico: curso.id_topico ?? null,
    };
    setSel(next);

    if (next.id_categoria) {
      const filteredAreas = allAreas.filter(a => Number(a.id_categoria) === Number(next.id_categoria));
      setAreas(filteredAreas);
    } else setAreas([]);

    if (next.id_area) {
      const filteredTop = allTopicos.filter(t => Number(t.id_area) === Number(next.id_area));
      setTopicos(filteredTop);
    } else setTopicos([]);
  }, [curso, allAreas, allTopicos]);

  const thumbUrl = useMemo(() => buildThumbUrl(curso), [curso]);

  // coloca isto perto do onChange
  const canEdit = (name) => {
    switch (name) {
      case "titulo": return edit.titulo;
      case "introducao_curso": return edit.intro;
      case "descricao": return edit.descricao;
      default: return true; // os outros já têm a sua própria lógica
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    if (!canEdit(name)) return;         // <- BLOQUEIA alterações
    setCurso(c => ({ ...c, [name]: value }));
  };

  const onImagem = (e) => {
    const file = e.target.files?.[0];
    if (file) setImagem(file);
  };

  // Handler específico para descrição (só funciona se editável)
  const onDescricaoChange = (e) => {
    if (!edit.descricao) return; // Bloqueia se não estiver em modo de edição
    setCurso(c => ({ ...c, descricao: e.target.value }));
  };

  // Toggle do estado de edição da descrição
  const toggleDescricaoEdit = () => {
    console.log("Toggling descrição edit from", edit.descricao, "to", !edit.descricao);
    setEdit(e => ({ ...e, descricao: !e.descricao }));
  };

  // Submissão fiel ao backend
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!curso) return;

    try {
      const isSincrono = (curso.tipo || "") === "Sincrono";

      if (!imagem) {
        // JSON
        const payload = {
          titulo: curso.titulo ?? "",
          descricao: curso.descricao ?? "",
          introducao_curso: curso.introducao_curso ?? "",
        };

        if (isSincrono) {
          if (curso.data_limite_inscricao) payload.data_limite_inscricao = curso.data_limite_inscricao;
          if (curso.num_vagas !== undefined && curso.num_vagas !== null && curso.num_vagas !== "")
            payload.maxVagas = curso.num_vagas; // nome esperado pelo backend
        } else {
          if (curso.duracao !== undefined && curso.duracao !== null && curso.duracao !== "")
            payload.duracao = curso.duracao;
        }

        await api.put(`/cursos/${id_curso}`, payload);
      } else {
        // multipart
        const fd = new FormData();
        fd.append("titulo", curso.titulo ?? "");
        fd.append("descricao", curso.descricao ?? "");
        fd.append("introducao_curso", curso.introducao_curso ?? "");

        if (isSincrono) {
          if (curso.data_limite_inscricao) fd.append("data_limite_inscricao", curso.data_limite_inscricao);
          if (curso.num_vagas !== undefined && curso.num_vagas !== null && curso.num_vagas !== "")
            fd.append("maxVagas", String(curso.num_vagas));
        } else {
          if (curso.duracao !== undefined && curso.duracao !== null && curso.duracao !== "")
            fd.append("duracao", String(curso.duracao));
        }

        fd.append("imagem", imagem); // multer.single('imagem')
        await api.put(`/cursos/${id_curso}`, fd);
      }

      alert("Curso atualizado com sucesso!");
      navigate(`/gestor/cursos/${id_curso}`);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.mensagem || "Erro ao atualizar curso.");
    }
  };

  if (!curso) return <div className="loading">A carregar…</div>;
  const isSincrono = (curso.tipo || "") === "Sincrono";

  return (
    <form onSubmit={onSubmit} className="det-curso">
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-left">
            {/* Título */}
            <div className="editable-row">
              <input
                className={`h1-input ${!edit.titulo ? "is-locked" : ""}`}
                name="titulo"
                value={curso.titulo || ""}
                onChange={onChange}
                readOnly={!edit.titulo}              // <- respeita o lock
                aria-disabled={!edit.titulo}
              />
              <button
                type="button"
                className="edit-btn"
                onClick={() => setEdit(e => ({ ...e, titulo: !e.titulo }))}
              /*  Mostra desbloqueado quando pode editar, cadeado quando está bloqueado  */
                title={edit.titulo ? "Edição ativa" : "Edição bloqueada"}
              >
                <FontAwesomeIcon icon={edit.titulo ? faUnlock : faLock} />
              </button>
            </div>

            {/* Intro */}
            <div className="editable-row">
              <input
                className={`tagline-input ${!edit.intro ? "is-locked" : ""}`}
                name="introducao_curso"
                value={curso.introducao_curso || ""}
                onChange={onChange}
                readOnly={!edit.intro}                // <- respeita o lock
                aria-disabled={!edit.intro}
                placeholder="Escreve um subtítulo curto do curso…"
              />
              <button
                type="button"
                className="edit-btn"
                onClick={() => setEdit(e => ({ ...e, intro: !e.intro }))}
                title={edit.intro ? "Edição ativa" : "Edição bloqueada"}
              >
                <FontAwesomeIcon icon={edit.intro ? faUnlock : faLock} />
              </button>
            </div>
          </div>

          {/* CARD */}
          <aside className="hero-right">
            <div className="summary-card">
              <div className="card-cover">
                <img
                  src={thumbUrl}
                  alt={curso.titulo}
                  onError={(e) => (e.currentTarget.src = DEFAULT_IMAGE_URL)}
                />
                <label className="editar-foto">
                  <input type="file" accept="image/*" onChange={onImagem} />
                  Editar Foto
                </label>
                <div className="card-cover-title">{curso.titulo}</div>
              </div>

              <div className="card-rows">
                {/* FORMADOR (read-only) */}
                <div className="row">
                  <span className="mi">person</span>
                  <span className="label">FORMADOR</span>
                  <span className="value link">{curso.nomeFormador || "—"}</span>
                </div>

                {/* DATAS (bloqueado) */}
                <div className="row is-locked" title="Campo bloqueado: não pode ser alterado">
                  <span className="mi">schedule</span>
                  <span className="label">DATA INÍCIO - FIM</span>
                  <div className="row-inner">
                    <div className="value dual">
                      <input type="date" name="data_inicio" value={(curso.data_inicio || "").slice(0,10)} disabled />
                      <span className="sep">—</span>
                      <input type="date" name="data_fim" value={(curso.data_fim || "").slice(0,10)} disabled />
                    </div>
                  </div>
                </div>

                {/* INSCRIÇÃO (só síncrono) */}
                <div className={`row ${!isSincrono ? "is-locked" : ""}`} title={!isSincrono ? "Campo bloqueado para cursos assíncronos" : ""}>
                  <span className="mi">event</span>
                  <span className="label">INSCRIÇÃO (Data Limite)</span>
                  <div className="row-inner">
                    <div className="value">
                      <input
                        type="date"
                        name="data_limite_inscricao"
                        value={(curso.data_limite_inscricao || "").slice(0,10)}
                        onChange={onChange}
                        disabled={!isSincrono}
                      />
                    </div>
                  </div>
                </div>

                {/* VAGAS (só síncrono) */}
                <div className={`row ${!isSincrono ? "is-locked" : ""}`} title={!isSincrono ? "Campo bloqueado para cursos assíncronos" : ""}>
                  <span className="mi">group</span>
                  <span className="label">MAX VAGAS</span>
                  <div className="row-inner">
                    <div className="value">
                      <input
                        type="number"
                        min="1"
                        name="num_vagas"
                        className="small"
                        value={curso.num_vagas ?? ""}
                        onChange={onChange}
                        disabled={!isSincrono}
                      />
                    </div>
                  </div>
                </div>

                {/* CATEGORIA/ÁREA/TÓPICO (bloqueados) */}
                <div className="row is-locked" title="Campo bloqueado: não pode ser alterado">
                  <span className="mi">category</span>
                  <span className="label">CATEGORIA</span>
                  <div className="row-inner">
                    <div className="value">
                      <select value={sel.id_categoria ?? ""} disabled>
                        <option value="">{loadingAreas ? "A carregar…" : "— Selecionar —"}</option>
                        {categorias.map(c => (
                          <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row is-locked" title="Campo bloqueado: não pode ser alterado">
                  <span className="mi">dashboard</span>
                  <span className="label">ÁREA</span>
                  <div className="row-inner">
                    <div className="value">
                      <select value={sel.id_area ?? ""} disabled>
                        <option value="">{loadingAreas ? "A carregar áreas…" : "— Selecionar —"}</option>
                        {areas.map(a => (
                          <option key={a.id_area} value={a.id_area}>{a.nome_area}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row is-locked" title="Campo bloqueado: não pode ser alterado">
                  <span className="mi">label</span>
                  <span className="label">TÓPICO</span>
                  <div className="row-inner">
                    <div className="value">
                      <select value={sel.id_topico ?? ""} disabled>
                        <option value="">{loadingTopicos ? "A carregar tópicos…" : "— Selecionar —"}</option>
                        {topicos.map(t => (
                          <option key={t.id_topico} value={t.id_topico}>{t.nome_topico}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* TIPO (bloqueado) */}
                <div className="row is-locked" title="Campo bloqueado: não pode ser alterado">
                  <span className="mi">bolt</span>
                  <span className="label">TIPO</span>
                  <div className="row-inner">
                    <div className="value">
                      <div className="pill">
                        <label className="radio">
                          <input type="radio" name="tipo" value="Sincrono" checked={(curso.tipo || "") === "Sincrono"} disabled />
                          <span>Síncrono</span>
                        </label>
                        <label className="radio">
                          <input type="radio" name="tipo" value="Assincrono" checked={(curso.tipo || "") === "Assincrono"} disabled />
                          <span>Assíncrono</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="brand">
              <img className="brand-logo" src="../../../assets/logotipo.png" alt="SOFTINSA" />
            </div>
          </aside>
        </div>
      </section>

      {/* DESCRIÇÃO */}
      <section className="content">
        <div className="container">
          <div
            id="sec-descricao"
            className={`descricao-page ${edit.descricao ? "editing" : "locked"}`}
            title={edit.descricao ? "" : "Clica no ícone para editar a descrição"}
          >
            <div className="editable-row between">
              <h2>Descrição</h2>
              <button
                type="button"
                className="edit-btn"
                onClick={toggleDescricaoEdit}
                title={edit.descricao ? "Edição ativa" : "Edição bloqueada"}
              >
                <FontAwesomeIcon icon={edit.descricao ? faUnlock : faLock} />
              </button>
            </div>

            <textarea
              className="desc-textarea"
              name="descricao"
              rows={10}
              value={curso.descricao ?? ""}
              onChange={onDescricaoChange}
              disabled={!edit.descricao}
              placeholder="Escreve a descrição do curso aqui…"
            />
          </div>
        </div>
      </section>

      {/* FOOTER DE AÇÕES */}
      <div className="actions-footer">
        <div className="container actions-footer-inner">
          <div className="actions-left">
            <span className="muted">Certifica-te que todos os campos estão corretos.</span>
          </div>
          <div className="actions-right">
            <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn primary">Guardar alterações</button>
          </div>
        </div>
      </div>
    </form>
  );
}