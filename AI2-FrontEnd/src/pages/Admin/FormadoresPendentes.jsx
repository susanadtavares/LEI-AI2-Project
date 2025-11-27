// File: FormadoresPendentes.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import "./PedidosPendentes.css";
import api from "../../api";

export default function FormadoresPendentes() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // actionLoading: { [id_pedido]: "aprovar" | "rejeitar" | null }
  const [actionLoading, setActionLoading] = useState({});

  // Paginação (6 por página)
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/pedidos-registo");
      const formadores = res.data.filter((p) => p.tipo === "formador");
      console.log("Fetched pedidos structure (formadores):", formadores);
      if (formadores.length > 0 && !formadores[0].id_pedido) {
        console.warn("No 'id_pedido' found in pedidos data:", formadores[0]);
        setError(
          "Os dados recebidos não contêm um ID válido (id_pedido). Contacte o administrador."
        );
      }
      setPedidos(formadores);
    } catch (err) {
      setError("Erro ao carregar os dados. Tente novamente.");
      console.error("Erro ao buscar formadores:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAction = useCallback(
    async (id_pedido, action) => {
      if (!id_pedido || isNaN(Number(id_pedido))) {
        alert(
          "ID inválido para a ação. Verifique os dados no console ou contacte o administrador."
        );
        console.log(
          "Invalid ID detected, available pedidos:",
          pedidos.map((p) => ({ id_pedido: p.id_pedido, nome: p.nome }))
        );
        return;
      }

      const token = localStorage.getItem("token");
      console.log(
        "Sending request with token:",
        token?.replace(/^"|"$/g, ""),
        "to endpoint:",
        action
      );

      // Só o botão clicado entra em loading:
      setActionLoading((prev) => ({ ...prev, [id_pedido]: action }));

      try {
        const endpoint =
          action === "aprovar"
            ? `/pedidos-registo/aprovar/${id_pedido}`
            : `/pedidos-registo/rejeitar/${id_pedido}`;
        const response = await api.put(
          endpoint,
          {},
          { headers: { "X-Request-Source": "web" } }
        );
        console.log(`Action ${action} response:`, response.data);

        // Atualiza estado local imediatamente
        setPedidos((prevPedidos) =>
          prevPedidos.map((pedido) =>
            pedido.id_pedido === id_pedido
              ? {
                  ...pedido,
                  estado: action === "aprovar" ? "aprovado" : "rejeitado",
                }
              : pedido
          )
        );

        alert(`Pedido ${action === "aprovar" ? "aprovado" : "rejeitado"}!`);
        fetchPedidos(); // refresh de segurança
      } catch (err) {
        console.error(
          `Erro ao ${action} pedido:`,
          err.response?.data || err.message
        );
        if (err.response?.status === 401) {
          alert("Sessão expirada. Faça login novamente.");
        } else if (err.response?.status === 500) {
          alert("Erro no servidor. Contacte o administrador. Detalhes no console.");
        } else {
          alert(`Erro ao ${action} pedido. Verifique o console para detalhes.`);
        }
      } finally {
        // Limpa loading do item
        setActionLoading((prev) => ({ ...prev, [id_pedido]: null }));
      }
    },
    [fetchPedidos, pedidos]
  );

  const aprovar = useCallback(
    (id_pedido) => handleAction(id_pedido, "aprovar"),
    [handleAction]
  );

  const rejeitar = useCallback(
    (id_pedido) => {
      if (window.confirm("Tem a certeza que deseja rejeitar este pedido?")) {
        handleAction(id_pedido, "rejeitar");
      }
    },
    [handleAction]
  );

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Paginação
  const totalPages = Math.ceil(pedidos.length / PAGE_SIZE) || 1;
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = pedidos.slice(start, start + PAGE_SIZE);

  const columns = useMemo(
    () => [
      {
        key: "nome",
        label: "Nome",
        render: (item) => (
          <div className="user-cell">
            <div className="avatar" aria-hidden>
              {item?.nome?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="user-name">{item.nome}</span>
          </div>
        ),
      },
      { key: "email", label: "Email" },
      {
        key: "data_pedido",
        label: "Data",
        render: (item) =>
          item.data_pedido ? new Date(item.data_pedido).toLocaleDateString() : "-",
      },
      {
        key: "acoes",
        label: "Ações",
        render: (item) => {
          if (item.estado === "pendente" && item.id_pedido) {
            const loadingType = actionLoading[item.id_pedido]; // "aprovar" | "rejeitar" | null
            return (
              <div className="acoes-cell">
                <button
                  className="btn-aprovar"
                  onClick={() => aprovar(item.id_pedido)}
                  disabled={loadingType === "aprovar"}
                  aria-busy={loadingType === "aprovar"}
                  aria-label={`Aprovar pedido de ${item.nome}`}
                >
                  {loadingType === "aprovar" ? "Aprovando..." : "Aprovar"}
                </button>
                <button
                  className="btn-rejeitar"
                  onClick={() => rejeitar(item.id_pedido)}
                  disabled={loadingType === "rejeitar"}
                  aria-busy={loadingType === "rejeitar"}
                  aria-label={`Rejeitar pedido de ${item.nome}`}
                >
                  {loadingType === "rejeitar" ? "Rejeitando..." : "Rejeitar"}
                </button>
              </div>
            );
          }
          if (item.estado === "aprovado")
            return <span className="status aprovado">Aprovado</span>;
          if (item.estado === "rejeitado")
            return <span className="status rejeitado">Rejeitado</span>;
          return null;
        },
      },
    ],
    [aprovar, rejeitar, actionLoading]
  );

  const goTo = (e, n) => {
    e.preventDefault();
    if (n < 1 || n > totalPages) return;
    setCurrentPage(n);
  };

  return (
    <div className="pagina-pendentes">
      {loading && <p className="loading">Carregando...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <div className="section">
          <h2>
            <span className="heading-text">Pedidos de Formadores</span>
          </h2>

          {pedidos.length === 0 ? (
            <p>Sem pedidos de formadores.</p>
          ) : (
            <>
              <div className="table-wrapper">
                <table role="grid" aria-label="Pedidos de Formadores">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} scope="col">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, index) => (
                      <tr
                        key={item.id_pedido || index}
                        className={index === pageItems.length - 1 ? "last-row" : ""}
                      >
                        {columns.map((col) => (
                          <td key={col.key} data-label={col.label}>
                            {col.render ? col.render(item) : item[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination-area">
                  <nav aria-label="Navegação de páginas">
                    <ul className="pagination">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <a
                          className="page-link"
                          href="#"
                          aria-label="Anterior"
                          onClick={(e) => goTo(e, currentPage - 1)}
                        >
                          <span aria-hidden="true">&laquo;</span>
                          <span className="sr-only">Previous</span>
                        </a>
                      </li>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <li
                          key={n}
                          className={`page-item ${n === currentPage ? "active" : ""}`}
                        >
                          <a
                            className="page-link"
                            href="#"
                            onClick={(e) => goTo(e, n)}
                          >
                            {n}
                          </a>
                        </li>
                      ))}

                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <a
                          className="page-link"
                          href="#"
                          aria-label="Seguinte"
                          onClick={(e) => goTo(e, currentPage + 1)}
                        >
                          <span aria-hidden="true">&raquo;</span>
                          <span className="sr-only">Next</span>
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
