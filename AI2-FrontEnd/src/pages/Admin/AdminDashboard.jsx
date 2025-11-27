// Run before: npm install chart.js react-chartjs-2
import { useEffect, useMemo, useState } from 'react';
import StatsCard from '../../components/StatsCard';
import CourseCard from '../../components/CourseCard';
import api from '../../api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';
import './AdminDashboard.css';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// Helper: resolve URL de imagem (Cloud/relativa)
const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:3001';

function resolveImageUrl(course) {
  const src =
    course?.thumbnail ||
    course?.tumbnail ||            // typo comum
    course?.imagem_url ||
    course?.url_imagem ||
    course?.foto_curso ||
    '';
  if (!src) return 'https://res.cloudinary.com/di4up9s9u/image/upload/v1755604007/defaultcurso_w0zceo.png';
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return `${API_BASE}${src}`;
  if (src.startsWith('uploads/')) return `${API_BASE}/${src}`;
  return `${API_BASE}/uploads/${src}`;
}

// Helper: normaliza estrutura do /dashboard/stats (aceita vários nomes)
function normalizeStats(raw) {
  const data = raw?.data ?? raw ?? {};

  const totalUsers =
    data.totalUsers ??
    data.utilizadoresTotal ??
    data.total_utilizadores ??
    0;

  const totalFormandos =
    data.totalFormandos ??
    data.formandosTotal ??
    data.total_formandos ??
    0;

  const totalFormadores =
    data.totalFormadores ??
    data.formadoresTotal ??
    data.total_formadores ??
    0;

  const totalCursos =
    data.totalCursos ??
    data.cursosTotal ??
    data.total_cursos ??
    0;

  const latestUsers =
    data.latestUsers ??
    data.ultimosUtilizadores ??
    data.ultimos_users ??
    data.usersRecentes ??
    data.utilizadoresRecentes ??
    [];

  const latestCourses =
    data.latestCourses ??
    data.ultimosCursos ??
    data.cursosRecentes ??
    data.ultimos_cursos ??
    [];

  // Normalizar users
  const users = Array.isArray(latestUsers)
    ? latestUsers.map((u, idx) => ({
        id: u.id ?? u.id_utilizador ?? u.idUser ?? idx,
        nome: u.nome ?? u.nome_utilizador ?? u.name ?? '—',
        email: u.email ?? u.email_utilizador ?? '—',
        tipo: u.tipo ?? u.tipo_utilizador ?? u.role ?? '—',
      }))
    : [];

  // Normalizar cursos
  const courses = Array.isArray(latestCourses)
    ? latestCourses.map((c, idx) => ({
        id_curso: c.id_curso ?? c.id ?? c.idCurso ?? idx,
        titulo: c.titulo ?? c.nome ?? 'Curso',
        descricao: c.descricao ?? c.descricao_curso ?? '',
        imageUrl: resolveImageUrl(c),
      }))
    : [];

  return {
    totalUsers,
    totalFormandos,
    totalFormadores,
    totalCursos,
    latestUsers: users,
    latestCourses: courses,
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((response) => {
        // consola para ver payload exato, se precisares:
        // console.log('Estatísticas recebidas:', response.data);
        setStats(normalizeStats(response.data));
      })
      .catch((error) => {
        console.error('Erro ao buscar estatísticas:', error);
        setErrorMsg('Não foi possível carregar as estatísticas.');
      });
  }, []);

  const chartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ['Utilizadores', 'Formandos', 'Formadores', 'Cursos'],
      datasets: [
        {
          label: 'Totais',
          data: [
            stats.totalUsers,
            stats.totalFormandos,
            stats.totalFormadores,
            stats.totalCursos,
          ],
          backgroundColor: ['#3498db', '#2ecc71', '#e67e22', '#9b59b6'],
        },
      ],
    };
  }, [stats]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
  };

  return (
    <div className="admin-dashboard">
      {/* Banner */}
      <div className="admin-banner">
        <div className="banner-inner">
          <h2 className="admin-title">Bem-Vindo, Administrador!</h2>

          {stats && (
            <div className="banner-stats">
              <StatsCard label="Total Utilizadores" value={stats.totalUsers} percentage="+8.5%" />
              <StatsCard label="Total Formandos" value={stats.totalFormandos} percentage="+2.1%" />
              <StatsCard label="Total Formadores" value={stats.totalFormadores} percentage="+1.3%" />
              <StatsCard label="Total Cursos" value={stats.totalCursos} percentage="+20%" />
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="admin-content">
        {errorMsg && <p className="loading">{errorMsg}</p>}

        {stats ? (
          <>
            {/* Gráfico */}
            <div className="chart-container">
              <h3>Resumo Gráfico</h3>
              {chartData && <Bar data={chartData} options={chartOptions} />}
            </div>

            {/* Últimos utilizadores */}
            <div className="latest-users">
              <h3>Últimos Utilizadores</h3>
              {stats.latestUsers.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.latestUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.nome}</td>
                        <td>{user.email}</td>
                        <td>{user.tipo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="muted">Sem utilizadores recentes.</p>
              )}
            </div>

            {/* Últimos cursos */}
            <div className="courses-container">
              <h3>Últimos Cursos Criados</h3>
              {stats.latestCourses.length ? (
                stats.latestCourses.map((course) => (
                  <CourseCard
                    key={course.id_curso}
                    title={course.titulo}
                    description={course.descricao}
                    imageUrl={course.imageUrl}
                  />
                ))
              ) : (
                <p className="muted">Sem cursos recentes.</p>
              )}
            </div>
          </>
        ) : (
          !errorMsg && <p className="loading">A carregar estatísticas...</p>
        )}
      </div>
    </div>
  );
}
