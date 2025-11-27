import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";

import "./AdicionarPostTopico.css";

export default function AdicionarPostTopico() {
  const location = useLocation();
  const navigate = useNavigate();

  const categoriaSelecionada = location.state?.categoria;
  const { topicoId } = useParams();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("texto");
  const [anexos, setAnexos] = useState([]);
  const [link, setLink] = useState('');

  const usuarioLogado = JSON.parse(localStorage.getItem("user"));
  const fullDescricao = descricao + (link ? ' ' + link : '');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/publicacao", {
        titulo_publicacao: titulo,
        descricao_publicacao: fullDescricao,
        data_publicacao: new Date().toISOString(),
        id_utilizador: usuarioLogado?.id,
        id_topico: topicoId,
      });

      const id_publicacao = response.data.id_publicacao;

      if (anexos.length > 0) {
        const formData = new FormData();
        anexos.forEach((file) => formData.append("anexos", file));

        console.log(">>> FormData antes de enviar:", formData);

        try {
          console.log(">>> A iniciar upload de anexos...");
          await axios.post(
            `/api/anexo_publicacao/upload/${id_publicacao}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } catch (uploadErr) {
          console.error(
            "Erro no upload dos anexos:",
            uploadErr.response?.data || uploadErr
          );
          alert("Post criado, mas houve erro ao enviar anexos.");
          return;
        }
      }

      alert("Post criado com sucesso!");
      navigate(-1);
    } catch (err) {
      console.error("Erro ao criar post:", err.response?.data || err.message);
      alert(
        `Erro ao criar post: ${err.response?.data?.mensagem || err.message}`
      );
    }
  };

  return (
    <div className="pagina-forum">
      <div className="forum-container">
        <aside className="sidebar">
          <div className="categoria-item ativo">
            <span className="nome">
              {categoriaSelecionada?.nome_categoria || "Categoria"}
            </span>
          </div>
        </aside>

        <main className="atconteudo-forum">
          <div className="attopicos-box">
            <h2>Criar Post</h2>
            <nav className="abas-post">
              <button
                className={abaAtiva === "texto" ? "ativa" : ""}
                onClick={() => setAbaAtiva("texto")}
              >
                Texto
              </button>
              <button
                className={abaAtiva === "imagens" ? "ativa" : ""}
                onClick={() => setAbaAtiva("imagens")}
              >
                Imagens
              </button>
              <button
                className={abaAtiva === "link" ? "ativa" : ""}
                onClick={() => setAbaAtiva("link")}
              >
                Link
              </button>
              <button
                className={abaAtiva === "anexos" ? "ativa" : ""}
                onClick={() => setAbaAtiva("anexos")}
              >
                Anexos
              </button>
            </nav>

            <form onSubmit={handleSubmit} className="form-topico">
              <input
                type="text"
                placeholder="Título"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
              {abaAtiva === "texto" && (
                <textarea
                  placeholder="Descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
              )}
              {abaAtiva === "imagens" && (
                <div>
                  <input type="file" accept="anexos" multiple onChange={(e) => setAnexos(Array.from(e.target.files))} />
                </div>
              )}
              {abaAtiva === "link" && (
                <div>
                  <input type="url" placeholder="Coloque o link aqui" value={link} onChange={(e) => setLink(e.target.value)} />
                </div>
              )}

              {abaAtiva === "anexos" && (
                <div>
                  <input type="file" multiple onChange={(e) => setAnexos(Array.from(e.target.files))}/>
                </div>
              )}
              <div className="botoes-form">
                <button type="submit" className="atbtn-confirmar">
                  Guardar
                </button>
                <button type="button" className="atbtn-cancelar"onClick={() => navigate(-1)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
