// src/pages/Admin/OpCursos/AdicionarCurso.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import FormField from "../../../components/FormField";
import "../OpCursos/AddCurso.css";

export default function AdicionarCurso() {
  const navigate = useNavigate();

  const DEFAULT_IMAGE_URL =
    "https://res.cloudinary.com/di4up9s9u/image/upload/v1755608744/portal_x1e8kh.png";

  // listas
  const [formadores, setFormadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [topicos, setTopicos] = useState([]);

  // imagem local + preview
  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState("");

  // estado
  const [submetendo, setSubmetendo] = useState(false);
  const [gestorId, setGestorId] = useState(null);

  // form
  const [curso, setCurso] = useState({
    titulo: "",
    descricao: "",
    dataFim: "",
    duracao: "",
    formador: "", // id do formador
    dataInicio: "",
    dataLimiteInscricao: "",
    maxVagas: "",
    categoria: "",
    area: "",
    topico: "",
    tipo: "", // "Sincrono" | "Assincrono" (UI)
    introducao_curso: "",
  });

  // helpers
  const getAreaCategoriaId = (a) =>
    a?.id_categoria ?? a?.categoria_id ?? a?.categoria?.id_categoria ?? null;

  const getTopicoAreaId = (t) =>
    t?.id_area ?? t?.area_id ?? t?.area?.id_area ?? null;

  const pickList = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    const bag =
      raw?.data ?? raw?.rows ?? raw?.items ?? raw?.results ?? raw?.list ?? raw;
    if (Array.isArray(bag)) return bag;
    if (bag?.rows && Array.isArray(bag.rows)) return bag.rows;
    if (bag?.data && Array.isArray(bag.data)) return bag.data;
    if (bag && typeof bag === "object") return [bag];
    return [];
  };

  // datas: o controller exige datas FUTURAS e limite < início
  const todayISO = () => {
    const d = new Date();
    // para garantir "futuras" no lado do cliente, força min=hoje+1
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  // filtradas
  const filteredAreas = useMemo(() => {
    const catId = Number(curso.categoria);
    if (!catId) return [];
    return areas.filter((a) => Number(getAreaCategoriaId(a)) === catId);
  }, [areas, curso.categoria]);

  const filteredTopicos = useMemo(() => {
    const areaId = Number(curso.area);
    if (!areaId) return [];
    return topicos.filter((t) => Number(getTopicoAreaId(t)) === areaId);
  }, [topicos, curso.area]);

  // opções
  const opts = {
    categorias: categorias.map((c) => ({
      label:
        c.nome_categoria ??
        c.nome ??
        c.label ??
        `Categoria #${c.id_categoria ?? c.id}`,
      value: c.id_categoria ?? c.id,
    })),
    areas: filteredAreas.map((a) => ({
      label: a.nome_area ?? a.nome ?? a.label ?? `Área #${a.id_area ?? a.id}`,
      value: a.id_area ?? a.id,
    })),
    topicos: filteredTopicos.map((t) => ({
      label:
        t.nome_topico ?? t.nome ?? t.label ?? `Tópico #${t.id_topico ?? t.id}`,
      value: t.id_topico ?? t.id,
    })),
    formadores: (formadores ?? [])
      .map((f) => {
        const core = f?.formador ?? f;
        const idVal =
          core?.id_formador ??
          core?.idFormador ??
          core?.id ??
          core?.ID ??
          f?.id_formador ??
          f?.id ??
          f?.ID;
        const nome =
          core?.utilizador?.nome ??
          core?.nome ??
          f?.utilizador?.nome ??
          f?.nome ??
          "Formador";
        return idVal != null ? { label: nome, value: idVal } : null;
      })
      .filter(Boolean),
    tipo: [
      { label: "Assíncrono", value: "Assincrono" },
      { label: "Síncrono", value: "Sincrono" },
    ],
  };

  // descobrir gestor (o controller exige `criado_por` válido/ativo)
  const resolveGestorId = async () => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u?.tipo !== "gestor") return null;
    if (u?.id_gestor) return u.id_gestor;

    try {
      const res = await api.get("/gestores");
      const lista = pickList(res.data);
      const match = lista.find(
        (g) =>
          g.id_utilizador === u.id_utilizador ||
          g.utilizador_id === u.id_utilizador ||
          g.utilizador?.id_utilizador === u.id_utilizador ||
          g.utilizador?.email === u.email
      );
      return match?.id_gestor ?? null;
    } catch {
      return null;
    }
  };

  // carregar listas
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [fRes, cRes, aRes, tRes, gid] = await Promise.all([
          api.get("/formadores"),
          api.get("/categorias"),
          api.get("/areas"),
          api.get("/topicos"),
          resolveGestorId(),
        ]);
        if (!mounted) return;
        setFormadores(pickList(fRes?.data));
        setCategorias(pickList(cRes?.data));
        setAreas(pickList(aRes?.data));
        setTopicos(pickList(tRes?.data));
        setGestorId(gid || null);
      } catch (e) {
        console.error("Falha ao carregar dados iniciais:", e);
      }
    })();
    return () => void (mounted = false);
  }, []);

  // preview
  useEffect(() => {
    if (!imagem) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(imagem);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  const toNumberOrEmpty = (v) =>
    v === "" || v === null || v === undefined ? "" : Number(v);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "tipo") {
      // UI: sincroniza campos exclusivos e limpa campos que não se aplicam
      setCurso((prev) => ({
        ...prev,
        tipo: value,
        // Limpar campos específicos quando muda o tipo
        formador: value === "Assincrono" ? "" : prev.formador,
        maxVagas: value === "Assincrono" ? "" : prev.maxVagas,
        duracao: value === "Sincrono" ? "" : prev.duracao,
      }));
      return;
    }

    if (name === "categoria") {
      setCurso((prev) => ({
        ...prev,
        categoria: toNumberOrEmpty(value),
        area: "",
        topico: "",
      }));
      return;
    }

    if (name === "area") {
      setCurso((prev) => ({ ...prev, area: toNumberOrEmpty(value), topico: "" }));
      return;
    }

    if (name === "formador") {
      // só faz sentido em Síncrono
      if (curso.tipo !== "Sincrono") return;
      setCurso((prev) => ({ ...prev, formador: toNumberOrEmpty(value) }));
      return;
    }

    setCurso((prev) => ({ ...prev, [name]: value }));
  };

  // validações alinhadas com o controller
  const validarCliente = () => {
    if (!curso.tipo) return "Seleciona o tipo do curso.";
    if (!curso.titulo?.trim()) return "Título é obrigatório.";
    if (curso.titulo?.length > 100) return "Título não pode ter mais de 100 caracteres.";
    if (!curso.descricao?.trim()) return "Descrição é obrigatória.";
    if (curso.descricao?.length > 256) return "Descrição não pode ter mais de 256 caracteres.";
    if (curso.introducao_curso?.length > 256) return "Introdução não pode ter mais de 256 caracteres.";
    if (!curso.categoria) return "Seleciona uma categoria.";
    if (!curso.area) return "Seleciona uma área.";
    if (!curso.topico) return "Seleciona um tópico.";
    if (!curso.dataInicio || !curso.dataFim || !curso.dataLimiteInscricao)
      return "Datas são obrigatórias.";

    const hoje = new Date();
    const di = new Date(curso.dataInicio);
    const df = new Date(curso.dataFim);
    const dl = new Date(curso.dataLimiteInscricao);

    if ([di, df, dl].some((d) => isNaN(d))) return "Datas inválidas.";
    if (di <= hoje || df <= hoje || dl <= hoje)
      return "Datas devem ser futuras.";
    if (di >= df) return "Data de início deve ser anterior à data de fim.";
    if (dl >= di)
      return "Data limite de inscrição deve ser anterior à data de início.";

    if (curso.tipo === "Sincrono") {
      if (!curso.formador) return "Para cursos síncronos, escolhe um formador.";
      const vagas = parseInt(curso.maxVagas, 10);
      if (!vagas || isNaN(vagas) || vagas <= 0)
        return "Número máximo de vagas inválido.";
    } else {
      const dur = parseInt(curso.duracao, 10);
      if (!dur || isNaN(dur) || dur <= 0)
        return "Cursos assíncronos precisam de duração (horas).";
      if (curso.maxVagas) return "Assíncronos não têm vagas/limite de inscrições.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (!u || u.tipo !== "gestor") {
      alert("Gestor não autenticado. Por favor, volte a iniciar sessão.");
      return;
    }
    if (!gestorId) {
      alert("Não foi possível identificar o ID do gestor.");
      return;
    }

    const erro = validarCliente();
    if (erro) {
      alert(erro);
      return;
    }

    try {
      setSubmetendo(true);

      const fd = new FormData();
      // campos que o controller lê
      fd.append("titulo", curso.titulo);
      fd.append("descricao", curso.descricao);
      fd.append("dataInicio", curso.dataInicio);
      fd.append("dataFim", curso.dataFim);
      fd.append("dataLimiteInscricao", curso.dataLimiteInscricao);

      if (curso.tipo === "Sincrono") {
        fd.append("maxVagas", String(curso.maxVagas));
        fd.append("duracao", "");
      } else {
        fd.append("duracao", String(curso.duracao));
        fd.append("maxVagas", "");
      }

      fd.append("categoria", String(curso.categoria));
      fd.append("area", String(curso.area));
      fd.append("topico", String(curso.topico));

      // chave para o controller decidir o tipo
      fd.append(
        "formador",
        curso.tipo === "Sincrono" ? String(curso.formador) : "" // vazio/0 => Assíncrono
      );

      // extra
      fd.append("tipo", curso.tipo); // opcional (UI)
      fd.append("introducao_curso", curso.introducao_curso || "");
      fd.append("criado_por", String(gestorId));

      // ficheiro → multer single('thumbnail') → req.file
      if (imagem) {
        fd.append("thumbnail", imagem);
      }

      await api.post("/cursos", fd);

      alert("Curso criado com sucesso!");
      navigate("/gestor/cursos");
    } catch (err) {
      console.error("Erro ao criar curso:", err);
      const msg =
        err?.response?.data?.erro ||
        err?.response?.data?.mensagem ||
        "Verifique os campos.";
      alert(`Erro ao criar curso: ${msg}`);
    } finally {
      setSubmetendo(false);
    }
  };

  const isSincrono = curso.tipo === "Sincrono";
  const isAssincrono = curso.tipo === "Assincrono";
  const minDate = todayISO();

  return (
    <div>
      <div className="adicionar-curso-container">
        <h2 className="titulo-principal">Criar Curso</h2>
        <div className="card-formulario">
          <form className="formulario-curso" onSubmit={handleSubmit}>
            <div className="bloco-foto">
              <label className="caixa-foto">
                <span className="material-symbols-outlined icone-foto">
                  add_a_photo
                </span>
                <p>{submetendo ? "A enviar..." : "Adicionar foto"}</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagem(e.target.files[0] || null)}
                  hidden
                />
              </label>

              {preview ? (
                <img
                  src={preview}
                  alt="Pré-visualização"
                  style={{ marginTop: 10, maxWidth: 200, borderRadius: 8 }}
                />
              ) : (
                <img
                  src={DEFAULT_IMAGE_URL}
                  alt="Imagem padrão do curso"
                  style={{
                    marginTop: 10,
                    maxWidth: 200,
                    borderRadius: 8,
                    opacity: 0.9,
                  }}
                />
              )}
            </div>

            {/* Seleção do Tipo - Primeiro campo */}
            <div style={{ marginBottom: 20, width: "100%" }}>
              <FormField
                label="Tipo de Curso"
                name="tipo"
                type="select"
                value={curso.tipo}
                onChange={handleChange}
                options={opts.tipo}
                required
              />
            </div>

            {/* Mostrar aviso se nenhum tipo foi selecionado */}
            {!curso.tipo && (
              <div style={{ 
                padding: 15, 
                background: "#f0f0f0", 
                borderRadius: 8, 
                marginBottom: 20, 
                textAlign: "center",
                color: "#666"
              }}>
                Selecione o tipo de curso para ver os campos disponíveis
              </div>
            )}

            {/* Campos aparecem apenas após seleção do tipo */}
            {curso.tipo && (
              <div className="grupo-colunas">
                <div className="coluna-esquerda">
                  <FormField
                    label="Título"
                    name="titulo"
                    type="text"
                    value={curso.titulo}
                    onChange={handleChange}
                    required
                  />
                  
                  <FormField
                    label="Descrição"
                    name="descricao"
                    type="textarea"
                    value={curso.descricao}
                    onChange={handleChange}
                    required
                    inputProps={{ 
                      maxLength: 256,
                      placeholder: `Descrição do curso (máx. 256 caracteres)`
                    }}
                  />
                  {curso.descricao && (
                    <small style={{ color: curso.descricao.length > 256 ? '#d32f2f' : '#666', fontSize: '12px' }}>
                      {curso.descricao.length}/256 caracteres
                    </small>
                  )}
                  
                  <FormField
                    label="Introdução do Curso"
                    name="introducao_curso"
                    type="text"
                    value={curso.introducao_curso}
                    onChange={handleChange}
                    inputProps={{ 
                      maxLength: 256,
                      placeholder: `Introdução do curso (máx. 256 caracteres)`
                    }}
                  />
                  {curso.introducao_curso && (
                    <small style={{ color: curso.introducao_curso.length > 256 ? '#d32f2f' : '#666', fontSize: '12px' }}>
                      {curso.introducao_curso.length}/256 caracteres
                    </small>
                  )}

                  {/* Campo Duração - apenas para Assíncronos */}
                  {isAssincrono && (
                    <FormField
                      label="Duração (horas)"
                      name="duracao"
                      type="number"
                      value={curso.duracao}
                      onChange={handleChange}
                      required
                    />
                  )}
                  
                  <FormField
                    label="Categoria"
                    name="categoria"
                    type="select"
                    value={curso.categoria}
                    onChange={handleChange}
                    options={opts.categorias}
                    required
                  />
                  
                  <FormField
                    label="Área"
                    name="area"
                    type="select"
                    value={curso.area}
                    onChange={handleChange}
                    options={opts.areas}
                    disabled={!curso.categoria}
                    required
                  />
                  
                  <FormField
                    label="Tópico"
                    name="topico"
                    type="select"
                    value={curso.topico}
                    onChange={handleChange}
                    options={opts.topicos}
                    disabled={!curso.area}
                    required
                  />
                </div>

                <div className="coluna-direita">
                  {/* Campo Formador - apenas para Síncronos */}
                  {isSincrono && (
                    <FormField
                      label="Formador"
                      type="select"
                      name="formador"
                      value={curso.formador}
                      onChange={handleChange}
                      options={opts.formadores}
                      required
                    />
                  )}
                  
                  <FormField
                    label="Data Início"
                    type="date"
                    name="dataInicio"
                    value={curso.dataInicio}
                    onChange={handleChange}
                    inputProps={{ min: minDate }}
                    required
                  />
                  
                  <FormField
                    label="Data Fim"
                    type="date"
                    name="dataFim"
                    value={curso.dataFim}
                    onChange={handleChange}
                    inputProps={{ min: minDate }}
                    required
                  />
                  
                  <FormField
                    label="Data Limite Inscrição"
                    type="date"
                    name="dataLimiteInscricao"
                    value={curso.dataLimiteInscricao}
                    onChange={handleChange}
                    inputProps={{ min: minDate }}
                    required
                  />

                  {/* Campo Max Vagas - apenas para Síncronos */}
                  {isSincrono && (
                    <FormField
                      label="Máx Vagas"
                      name="maxVagas"
                      type="number"
                      value={curso.maxVagas}
                      onChange={handleChange}
                      required
                    />
                  )}
                </div>
              </div>
            )}

            {/* Botões sempre visíveis */}
            <div className="botoes-acao">
              <button
                type="button"
                className="botao-cancelar"
                onClick={() => navigate("/gestor/cursos")}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="botao-criar"
                disabled={!gestorId || submetendo || !curso.tipo}
              >
                Criar
              </button>
            </div>

            {!gestorId && (
              <small style={{ marginTop: 8, display: "block", color: "#b00" }}>
                Não foi possível identificar o ID do gestor. Faz login novamente
                ou garante que existe /gestores.
              </small>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}