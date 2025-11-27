import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronUp,
  faAngleRight,
  faMagnifyingGlass,
  faKey,
  faArrowRightFromBracket,
  faGear,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import {
  faUser,
  faBell,
  faComments,
  faMessage,
} from '@fortawesome/free-regular-svg-icons';
import api from '../api';
import './Navbar.css';
import logo from '../assets/logotipo.png';
import AddItemModal from './AddItemModal';

export default function Navbar() {
  const [submenuDefinicoes, setSubmenuDefinicoes] = useState(false);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [temNotificacoesNaoLidas, setTemNotificacoesNaoLidas] = useState(false);
  const [categoriasCompletas, setCategoriasCompletas] = useState([]);
  const [termo, setTermo] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuCategoriasAberto, setMenuCategoriasAberto] = useState(false);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [showMensagens, setShowMensagens] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalParentId, setModalParentId] = useState(null);
  const [modalParentName, setModalParentName] = useState('');

  const notificacoesRef = useRef(null);
  const menuRef = useRef(null);
  const explorarRef = useRef(null);
  const painelRef = useRef(null);
  const mensagensRef = useRef(null);

  const navigate = useNavigate();

  const user = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const idUser = user?.id_utilizador;

  const fetchCategoriasCompletas = async () => {
    try {
      const [catRes, areaRes, topicoRes] = await Promise.all([
        api.get('/categorias'),
        api.get('/areas'),
        api.get('/topicos'),
      ]);

      const categorias = catRes.data.data;
      const areas = areaRes.data.data;
      const topicos = topicoRes.data.data;

      const estruturado = categorias.map((categoria) => {
        const areasDaCategoria = areas.filter((a) => a.id_categoria === categoria.id_categoria);
        const areasComTopicos = areasDaCategoria.map((area) => ({
          ...area,
          topicos: topicos.filter((t) => t.id_area === area.id_area),
        }));
        return { ...categoria, areas: areasComTopicos };
      });

      setCategoriasCompletas(estruturado);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    }
  };

  useEffect(() => {
    fetchCategoriasCompletas();
  }, []);

  useEffect(() => {
    const fetchSugestoes = async () => {
      if (!termo.trim()) {
        setSugestoes([]);
        setMostrarSugestoes(false);
        return;
      }

      try {
        const res = await api.get(`/search/search?q=${encodeURIComponent(termo)}`);
        setSugestoes(res.data || []);
        setMostrarSugestoes(true);
      } catch (err) {
        console.error('Erro ao buscar sugestões:', err);
        setSugestoes([]);
      }
    };

    fetchSugestoes();
  }, [termo]);

  const fazerPesquisa = () => {
    if (!termo.trim()) return;
    navigate(`/resultados?q=${encodeURIComponent(termo.trim())}`);
    setTermo('');
  };

  useEffect(() => {
    if (!idUser) return;
    const notificacoes = JSON.parse(localStorage.getItem(`notificacoes_${idUser}`)) || [];
    const novas = notificacoes.some((n) => !n.lida);
    setTemNotificacoesNaoLidas(novas);
  }, [showNotificacoes, idUser]);

  useEffect(() => {
    if (!idUser) return;
    const armazenadas = JSON.parse(localStorage.getItem(`notificacoes_${idUser}`)) || [];
    setNotificacoes(armazenadas);
    setTemNotificacoesNaoLidas(armazenadas.some((n) => !n.lida));
  }, [idUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        (menuRef.current && !menuRef.current.contains(e.target)) &&
        (notificacoesRef.current && !notificacoesRef.current.contains(e.target)) &&
        (mensagensRef.current && !mensagensRef.current.contains(e.target)) &&
        (explorarRef.current && !explorarRef.current.contains(e.target)) &&
        (painelRef.current && !painelRef.current.contains(e.target))
      ) {
        setShowDropdown(false);
        setSubmenuDefinicoes(false);
        setShowNotificacoes(false);
        setShowMensagens(false);
        setMenuCategoriasAberto(false);
        setMenuPerfilAberto(false);
        setSelectedCategoria(null);
        setSelectedArea(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const marcarComoLida = async (id_notificacao) => {
    try {
      await api.put(`/notificacoes/lida/${idUser}/${id_notificacao}`);
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  const eliminarNotificacao = async (id_notificacao) => {
    try {
      await api.put(`/notificacoes/apagar/${idUser}/${id_notificacao}`);
    } catch (err) {
      console.error('Erro ao eliminar notificação:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const abrirMensagem = (mensagem) => {
    alert(`Abrir mensagem: ${mensagem.titulo}`);
  };

  const abrirMensagens = () => {
    setShowMensagens((prev) => !prev);
  };

  const abrirNotificacoes = () => {
    setShowNotificacoes(!showNotificacoes);
    setTemNotificacoesNaoLidas(false);
  };

  const handleLogoClick = () => {
    switch (user?.tipo) {
      case 'gestor':
        navigate('/gestor');
        break;
      case 'formador':
        navigate('/formador');
        break;
      case 'formando':
        navigate('/formando');
        break;
      default:
        navigate('/');
    }
  };

  const handleForumClick = () => {
    navigate('/forum');
  };

  const openModal = (type, parentId = null, parentName = '') => {
    setModalType(type);
    setModalParentId(parentId);
    setModalParentName(parentName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setModalParentId(null);
    setModalParentName('');
  };

  const handleModalSuccess = () => {
    fetchCategoriasCompletas();
    closeModal();
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img
          src={logo}
          alt="SOFTINSA"
          className="logo navbar-logo"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        />

        <div className="dropdown-explorar" ref={explorarRef}>
          <button
            className="botao-categoria"
            onClick={() => {
              setMenuCategoriasAberto((prev) => !prev);
              setMenuPerfilAberto(false);
              setSelectedCategoria(null);
              setSelectedArea(null);
            }}
          >
            Categorias
            <FontAwesomeIcon icon={faChevronDown} size="xs" />
          </button>

          {menuCategoriasAberto && (
            <div
              className="menu-cascata"
              onMouseLeave={() => {
                setMenuCategoriasAberto(false);
                setSelectedCategoria(null);
                setSelectedArea(null);
              }}
            >
              {/* Categories Column */}
              <div className="coluna-categorias">
                {user?.tipo === 'gestor' && (
                  <button
                    className="item-add"
                    onClick={() => openModal('categoria')}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Adicionar Categoria
                  </button>
                )}
                {categoriasCompletas.map((categoria) => (
                  <div
                    key={categoria.id_categoria}
                    className={`item-categoria ${selectedCategoria?.id_categoria === categoria.id_categoria ? 'ativo' : ''}`}
                    onMouseEnter={() => {
                      setSelectedCategoria(categoria);
                      setSelectedArea(null);
                    }}
                    onClick={() =>
                      (window.location.href = `/cursosFiltrados?categoria=${categoria.id_categoria}`)
                    }
                  >
                    {categoria.nome_categoria}
                    {categoria.areas.length > 0 && (
                      <FontAwesomeIcon icon={faAngleRight} className="chevron-icon seta-direita" />
                    )}
                  </div>
                ))}
              </div>

              {/* Areas Column */}
              {selectedCategoria && (user?.tipo === 'gestor' || selectedCategoria.areas.length > 0) && (
                <div className="coluna-areas">
                  {user?.tipo === 'gestor' && (
                    <button
                      className="item-add"
                      onClick={() => openModal('area', selectedCategoria.id_categoria, selectedCategoria.nome_categoria)}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Adicionar Área
                    </button>
                  )}
                  {selectedCategoria.areas.map((area) => (
                    <div
                      key={area.id_area}
                      className={`item-area ${selectedArea?.id_area === area.id_area ? 'ativo' : ''}`}
                      onMouseEnter={() => setSelectedArea(area)}
                      onClick={() =>
                        (window.location.href = `/cursosFiltrados?categoria=${selectedCategoria.id_categoria}&area=${area.id_area}`)
                      }
                    >
                      {area.nome_area}
                      {area.topicos.length > 0 && (
                        <FontAwesomeIcon icon={faAngleRight} className="chevron-icon seta-direita" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Topics Column */}
              {selectedArea && (user?.tipo === 'gestor' || selectedArea.topicos.length > 0) && (
                <div className="coluna-topicos">
                  {user?.tipo === 'gestor' && (
                    <button
                      className="item-add"
                      onClick={() => openModal('topico', selectedArea.id_area, selectedArea.nome_area)}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Adicionar Tópico
                    </button>
                  )}
                  {selectedArea.topicos.map((topico) => (
                    <div
                      key={topico.id_topico}
                      className="item-topico"
                      onClick={() =>
                        (window.location.href = `/cursosFiltrados?categoria=${selectedCategoria.id_categoria}&area=${selectedArea.id_area}&topico=${topico.id_topico}`)
                      }
                    >
                      {topico.nome_topico}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="barra-pesquisa">
          <div className="input-com-icone">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="icone-lupa" />
            <input
              type="text"
              placeholder="Pesquisar"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fazerPesquisa()}
            />
          </div>
          <button className="botao-pesquisar" onClick={fazerPesquisa}>
            Pesquisar
          </button>
        </div>
      </div>

      <div className="navbar-right">
        {user?.tipo === 'gestor' && (
          <div className="dropdown-container" ref={painelRef}>
            <button
              className="botao-categoria-icon"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              <FontAwesomeIcon icon={faChevronDown} size="xs" />
            </button>

            {showDropdown && (
              <div className="painel-dropdown-menu">
                <a href="/gestor/cursos" onClick={() => setShowDropdown(false)}>
                  Gestão de Cursos
                </a>
                <a href="/gestor/formadores" onClick={() => setShowDropdown(false)}>
                  Gestão de Formadores
                </a>
                <a href="/gestor/formandos" onClick={() => setShowDropdown(false)}>
                  Gestão de Formandos
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mensagens-container" ref={mensagensRef}>
          <button className="botao-categoria" onClick={abrirMensagens}>
            <FontAwesomeIcon icon={faMessage} />
            Mensagens
          </button>
          {showMensagens && (
            <div className="mensagens-dropdown">
              <div className="mensagem-item">
                <div className="mensagem-titulo">Mensagem de Exemplo</div>
                <div className="mensagem-detalhes">
                  <span className="remetente">Usuário Exemplo</span>
                  <span className="hora">10:30</span>
                </div>
              </div>
              <div className="mensagem-item">
                <div className="mensagem-titulo">Outra Mensagem</div>
                <div className="mensagem-detalhes">
                  <span className="remetente">Outro Usuário</span>
                  <span className="hora">09:15</span>
                </div>
              </div>
              <div className="sem-mensagens">Funcionalidade em desenvolvimento</div>
            </div>
          )}
        </div>

        <button className="botao-categoria" onClick={handleForumClick}>
          <FontAwesomeIcon icon={faComments} />
          Fórum
        </button>

        <div
          className="notificacoes-container"
          ref={notificacoesRef}
          onMouseEnter={() => setShowNotificacoes(true)}
          onMouseLeave={() => setShowNotificacoes(false)}
        >
          <button className="round-btn" onClick={abrirNotificacoes}>
            <FontAwesomeIcon icon={faBell} />
            {temNotificacoesNaoLidas && <span className="dot-vermelho"></span>}
          </button>

          {showNotificacoes && (
            <div className="notificacoes-dropdown">
              <p>
                <strong>Notificações</strong>
              </p>
              <ul>
                {notificacoes.length === 0 ? (
                  <li>Sem notificações.</li>
                ) : (
                  notificacoes.map((n, i) => (
                    <li key={i}>
                      <strong>{new Date(n.data).toLocaleTimeString('pt-PT')}:</strong> {n.mensagem}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="user-menu-container" ref={menuRef}>
          <button
            className="round-btn"
            onClick={() => {
              setMenuPerfilAberto(!menuPerfilAberto);
              setMenuCategoriasAberto(false);
              setSubmenuDefinicoes(false);
            }}
          >
            <FontAwesomeIcon icon={faUser} />
          </button>

          {menuPerfilAberto && (
            <div
              className="user-dropdown"
              onMouseLeave={() => {
                setMenuPerfilAberto(false);
                setSubmenuDefinicoes(false);
              }}
            >
              <button
                onClick={() => {
                  if (!user) return navigate('/login');
                  switch (user.tipo) {
                    case 'gestor':
                      navigate(`/gestor/perfil/${user.id}`);
                      break;
                    case 'formador':
                      navigate(`/formador/perfil/${user.id_utilizador}/${user.id_formador}`);
                      break;
                    case 'formando':
                      navigate(`/formando/perfil/${user.id_utilizador}/${user.id_formando}`);
                      break;
                    default:
                      navigate('/login');
                  }
                }}
              >
                <FontAwesomeIcon icon={faUser} /> Perfil
              </button>

              <div className="submenu">
                <button onClick={() => setSubmenuDefinicoes(!submenuDefinicoes)}>
                  <FontAwesomeIcon icon={faGear} /> Definições{' '}
                  <FontAwesomeIcon
                    icon={submenuDefinicoes ? faChevronUp : faChevronDown}
                    size="xs"
                    className="chevron-icon"
                  />
                </button>

                {submenuDefinicoes && (
                  <div className="submenu-items">
                    <button onClick={() => navigate('/upPassword')}>
                      <FontAwesomeIcon icon={faKey} />
                      Alterar Password
                    </button>
                  </div>
                )}
              </div>

              <button onClick={handleLogout}>
                <FontAwesomeIcon icon={faArrowRightFromBracket} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <AddItemModal
        isOpen={modalOpen}
        onClose={closeModal}
        type={modalType}
        parentId={modalParentId}
        parentName={modalParentName}
        onSuccess={handleModalSuccess}
      />
    </nav>
  );
}