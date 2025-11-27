import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import banner from '../../assets/forum/banner-forum.png';
import './ForumHome.css';

export default function ForumHome() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    (async () => {
      try {
        const [resCats, resAreas] = await Promise.all([
          api.get('/categorias'),
          api.get('/areas'),
        ]);
        const cats = resCats.data?.data ?? [];
        setCategorias(cats);
        setAreas(resAreas.data?.data ?? []);
        if (cats.length) setSelectedCategoriaId(cats[0].id_categoria);
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
      }
    })();
  }, []);

  const areasDaCategoria = useMemo(
    () => areas.filter(a => a.id_categoria === selectedCategoriaId),
    [areas, selectedCategoriaId]
  );

  const navegarParaArea = (area) => {
    const role = user?.tipo;
    const base =
      role === 'gestor' ? '/gestor/forum'
      : role === 'formando' ? '/forum/formando'
      : '/forum/formador';
    navigate(`${base}/${area.id_area}/topicos`, { state: { area } });
  };

  return (
    <div className="fh-page">
      <div className="fh-rail">
        <div className="fh-rail-inner">
          <ul className="fh-cat-list">
            {categorias.map(cat => {
              const active = cat.id_categoria === selectedCategoriaId;
              return (
                <li key={cat.id_categoria} className="fh-cat-item">
                  <div
                    className={`fh-cat-chip ${active ? 'is-active' : ''}`}
                    onClick={() => setSelectedCategoriaId(cat.id_categoria)}
                  >
                    <span className="fh-cat-label">{cat.nome_categoria}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          {user?.tipo === 'gestor' && (
            <div className="fh-rail-footer">
              <Link to="/gestao-denuncias" className="fh-rail-action">
                Gestão de Denúncias
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="fh-shell">
        <main className="fh-stage">
          <div className="fh-hero">
            <img src={banner} alt="" />
          </div>

          <h1 className="fh-area-title">
            {categorias.find(c => c.id_categoria === selectedCategoriaId)?.nome_categoria || 'Seleciona uma categoria'}
          </h1>

          {selectedCategoriaId && (
            <section className="fh-areas">
              <div className="fh-areas-head">Áreas</div>
              <div className="fh-areas-list">
                {areasDaCategoria.map(area => (
                  <div
                    key={area.id_area}
                    className="fh-area-row"
                    onClick={() => navegarParaArea(area)}
                  >
                    <div className="fh-area-name">{area.nome_area}</div>
                  </div>
                ))}

                {areasDaCategoria.length === 0 && (
                  <p className="fh-empty">Sem áreas disponíveis</p>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
