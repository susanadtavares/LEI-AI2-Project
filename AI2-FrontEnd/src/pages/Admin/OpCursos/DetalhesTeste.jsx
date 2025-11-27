import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNoteSticky,
  faDownload,
  faPen,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../../api";
import "./DetalhesTeste.css";

export default function DetalhesTeste() {
  const { id_teste } = useParams(); // espera rota /testes/:id_teste
  const navigate = useNavigate();

  const [teste, setTeste] = useState(null);
  const [anexosRecebidos, setAnexosRecebidos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [q, setQ] = useState("");

  //Restrição de acesso
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const tipo = user?.tipo;

    // só deixa entrar se for formador ou gestor
    if (tipo !== "formador" && tipo !== "gestor") {
      navigate("/login"); // ou para uma página de erro 403
    }
  }, [navigate]);

  // Carrega dados do teste (meta + anexo do teste)
  useEffect(() => {
    api
      .get(`/testes/${id_teste}`)
      .then((res) => {
        const t = res?.data?.data ?? res?.data ?? {};
        // normalização leve de campos
        const obj = {
          id: t.id_teste ?? t.id ?? id_teste,
          titulo:
            t.titulo_teste ?? t.titulo ?? t.nome ?? "Teste - sem título",
          dataEntrega:
            t.dataentrega_teste ?? t.data_entrega ?? t.data ?? null,
          anexo: t.anexo ?? t.anexo_teste ?? t.ficheiro ?? null,
        };
        setTeste(obj);
      })
      .catch(() => setTeste(null));
  }, [id_teste]);

  // Carrega anexos submetidos pelos formandos
  useEffect(() => {
    api
      .get(`/testes/${id_teste}/submissoes`)
      .then((res) => {
        const arr = res?.data?.data ?? res?.data ?? [];
        const mapped = arr.map((x) => ({
          id: x.id ?? x.id_submissao ?? crypto.randomUUID(),
          nome:
            x.nome ??
            x.aluno?.nome ??
            x.formando?.nome ??
            x.utilizador?.nome ??
            "Sem nome",
          avatar:
            x.avatar ??
            x.aluno?.avatar ??
            x.formando?.avatar ??
            x.utilizador?.avatar ??
            null,
          fileUrl: x.fileUrl ?? x.url ?? x.anexo_url ?? x.ficheiro_url ?? "#",
        }));
        setAnexosRecebidos(mapped);
      })
      .catch(() => setAnexosRecebidos([]));
  }, [id_teste]);

  // Carrega avaliações
  useEffect(() => {
    api
      .get(`/testes/${id_teste}/avaliacoes`)
      .then((res) => {
        const arr = res?.data?.data ?? res?.data ?? [];
        const mapped = arr.map((x) => ({
          id: x.id ?? x.id_avaliacao ?? crypto.randomUUID(),
          nota: x.nota ?? x.classificacao ?? "",
          nome:
            x.nome ??
            x.formando?.nome ??
            x.aluno?.nome ??
            x.utilizador?.nome ??
            "Sem nome",
          avatar:
            x.avatar ??
            x.formando?.avatar ??
            x.aluno?.avatar ??
            x.utilizador?.avatar ??
            null,
        }));
        setAvaliacoes(mapped);
      })
      .catch(() => setAvaliacoes([]));
  }, [id_teste]);

  const filtradas = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return avaliacoes;
    return avaliacoes.filter((a) => a.nome?.toLowerCase().includes(s));
  }, [q, avaliacoes]);

  function download(url) {
    if (!url || url === "#") return;
    // abre noutra aba para download
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function editarNota(item) {
    const valor = window.prompt(`Editar nota de ${item.nome}:`, item.nota ?? "");
    if (valor == null) return;
    try {
      await api.put(`/avaliacoes/${item.id}`, { nota: valor });
      setAvaliacoes((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, nota: valor } : a))
      );
    } catch (e) {
      alert("Não foi possível atualizar a nota.");
    }
  }

  const dataFormatada = useMemo(() => {
    if (!teste?.dataEntrega) return null;
    try {
      const d = new Date(teste.dataEntrega);
      return d.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return teste.dataEntrega;
    }
  }, [teste]);

  if (!teste) return <div className="dt-page"><div className="dt-shell"><p>A carregar…</p></div></div>;

  return (
    <div className="dt-page">
      <div className="dt-shell">
        {/* Breadcrumb simples (usa o título do teste também, se quiseres) */}
        <div className="dt-breadcrumb">
          <div className="dt-curso">{teste.titulo?.split("—")?.[0] || "Teste"}</div>
          <div className="dt-formador">{/* podes preencher via rota/estado se precisares */}</div>
        </div>

        <div className="dt-grid">
          {/* Esquerda: cartão do teste */}
          <section className="dt-card dt-main">
            <header className="dt-header">
              <div className="dt-icon-badge">
                <FontAwesomeIcon icon={faNoteSticky} />
              </div>
              <div className="dt-titlebox">
                <div className="dt-title">{teste.titulo}</div>
                {dataFormatada && <div className="dt-date">{dataFormatada}</div>}
              </div>
            </header>

            <div className="dt-anexo-do-teste">
              <div className="dt-anexo-title">Ficheiro anexado em pdf</div>
              {teste.anexo ? (
                <div className="dt-file-card" onClick={() => download(teste.anexo?.url ?? teste.anexo)}>
                  <div className="dt-file-thumb">
                    <img
                      src={teste.anexo?.thumb ?? "/assets/pdf-icon.png"}
                      alt="thumb"
                      onError={(e) => { e.currentTarget.src = "/assets/pdf-icon.png"; }}
                    />
                  </div>
                  <div className="dt-file-meta">
                    <div className="dt-file-name">
                      {teste.anexo?.name ?? "Teste 1"}
                    </div>
                    <div className="dt-file-ext">
                      {(teste.anexo?.ext ?? "PDF").toUpperCase()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="dt-file-empty">Sem ficheiro anexo.</div>
              )}
            </div>
          </section>

          {/* Direita: anexos recebidos */}
          <aside className="dt-card dt-side">
            <div className="dt-side-title">Anexos Recebidos</div>
            <div className="dt-side-list">
              {anexosRecebidos.map((s) => (
                <div key={s.id} className="dt-sub-card">
                  <img
                    className="dt-sub-avatar"
                    src={s.avatar || "https://i.pravatar.cc/64?img=1"}
                    alt={s.nome}
                    onError={(e) => {
                      e.currentTarget.src = "https://i.pravatar.cc/64?img=2";
                    }}
                  />
                  <div className="dt-sub-name">{s.nome}</div>
                  <button className="dt-download" onClick={() => download(s.fileUrl)} title="Download">
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* Avaliações */}
        <section className="dt-card dt-table-card">
          <div className="dt-table-head">
            <div className="dt-table-title">Avaliações</div>
            <div className="dt-search">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <input
                type="text"
                placeholder="Pesquisar Formando"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="dt-table">
            <div className="dt-tr dt-tr--header">
              <div className="dt-th dt-col-formando">Formando</div>
              <div className="dt-th">Nome</div>
              <div className="dt-th dt-col-nota">Nota</div>
              <div className="dt-th dt-col-acao"></div>
            </div>

            {filtradas.map((a) => (
              <div key={a.id} className="dt-tr">
                <div className="dt-td dt-col-formando">
                  <img
                    className="dt-pic"
                    src={a.avatar || "https://i.pravatar.cc/64?img=3"}
                    alt={a.nome}
                    onError={(e) => {
                      e.currentTarget.src = "https://i.pravatar.cc/64?img=4";
                    }}
                  />
                </div>
                <div className="dt-td">{a.nome}</div>
                <div className="dt-td dt-col-nota">{a.nota}</div>
                <div className="dt-td dt-col-acao">
                  <button className="dt-edit" onClick={() => editarNota(a)} title="Editar">
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
