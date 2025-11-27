import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

import AdminDashboard from '../pages/Admin/AdminDashboard';
import FormadorPage from '../pages/Formador/DashboardFormador';
import FormandoPage from '../pages/Formando/DashboardFormando';
import AdminGestaoFormandos from '../pages/Admin/OpFormando/AdminGestaoFormandos';
import AdicionarFormando from '../pages/Admin/OpFormando/AddFormando';
import EditarFormando from '../pages/Admin/OpFormando/EditarFormando';
import GestaoCursos from '../pages/Admin/OpCursos/GestaoCursos';
import AdicionarCurso from '../pages/Admin/OpCursos/AddCurso';
import AdminGestaoFormadores from '../pages/Admin/OpFormador/AdminGestaoFormador';
import PerfilAdmin from '../pages/Admin/perfilAdmin';
import PerfilFormador from '../pages/Formador/perfilFormador';
import PerfilFormando from '../pages/Formando/perfilFormando';
import TrocarPassword from '../pages/Autenticacao/upPassword';
import PaginaResultados from '../pages/Pesquisar/PaginaResultados';
import DetalhesCurso from '../pages/Admin/OpCursos/DetalhesCursos';
import ForumHome from '../pages/Forum/ForumHome'; 
import AdicionarPostTopico from '../pages/Forum/AdicionarPostTopico';
import AdicionarFormador from '../pages/Admin/OpFormador/AddFormador';
import EditarFormador from '../pages/Admin/OpFormador/EditarFormador';
import UpdateCurso from '../pages/Admin/OpCursos/UpdateCurso';
import NovaAula from '../pages/Admin/OpCursos/NovaAula';
import DetalhesAula from '../pages/Admin/OpCursos/DetalhesAula';
import EditarAula from '../pages/Admin/OpCursos/EditarAula';
import FormadoresPendentes from "../pages/Admin/FormadoresPendentes";
import FormandosPendentes from "../pages/Admin/FormandosPendentes";
import RegistoUtilizador from "../pages/Autenticacao/RegistoUtilizador";
import DetalhesCursoFormando from '../pages/Formando/DetalhesCursoFormando';
import EmailStep from "../pages/Autenticacao/EmailStep";
import ChatPage from '../pages/Mensagens/Chat';
import MensagensPage from '../pages/Mensagens/Message';
import Curso from '../pages/Admin/OpCursos/Curso';
import ForumAreaTopicos from '../pages/Forum/ForumAreaTopicos';
import ForumPosts from '../pages/Forum/ForumPosts';
import DetalhesTeste from '../pages/Admin/OpCursos/DetalhesTeste'
import GestaoDenuncias from '../pages/Forum/GestaoDenuncias';

const PrivateRoute = ({ children, role }) => {
  const userRole = JSON.parse(localStorage.getItem('user'))?.tipo;
  return userRole === role ? children : <Navigate to="/login" />;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas sem layout */}
        <Route path="/" element={<EmailStep />} />
        <Route path="/login" element={<EmailStep />} />
        <Route path="/alterarPassword" element={<TrocarPassword />} />
        <Route path="/registo" element={<RegistoUtilizador />} />

        {/* Rotas com layout (Navbar) */}
        <Route element={<AppLayout />}>
          {/* Admin/Gestor */}
          <Route path="/gestor" element={<AdminDashboard />} />
          <Route path="/gestor/perfil/:id" element={<PerfilAdmin />} />
          <Route path="/gestor/formandos" element={<AdminGestaoFormandos />} />
          <Route path="/gestor/formandos/novo" element={<AdicionarFormando />} />
          <Route path="/gestor/formandos/editar/:id_utilizador/:id_formando" element={<EditarFormando />} />
          <Route path="/gestor/cursos" element={<GestaoCursos />} />
          <Route path="/gestor/cursos/adicionar" element={<AdicionarCurso />} />
          <Route path="/gestor/cursos/editar/:id_curso" element={<UpdateCurso />} />
          <Route path="/gestor/cursos/:id_curso" element={<DetalhesCurso />} />
          <Route path="/gestor/cursos/:id_curso/curso" element={<Curso />} />
          <Route path="/gestor/cursos/sincrono/:id_curso" element={<Navigate to="/gestor/cursos/:id_curso/curso" replace />} />
          <Route path="/gestor/cursos/assincrono/:id_curso" element={<Navigate to="/gestor/cursos/:id_curso/curso" replace />} />
          <Route path="/gestor/cursos/:id_curso/aulas/nova" element={<NovaAula />} />
          <Route path="/gestor/cursos/:id_curso/aulas/:id_aula" element={<DetalhesAula />} />
          <Route path="/gestor/cursos/aulas/editar/:id_aula" element={<EditarAula />} />
          <Route path="/gestor/formadores" element={<AdminGestaoFormadores />} />
          <Route path="/gestor/formadores/novo" element={<AdicionarFormador />} />
          <Route path="/gestor/formadores/editar/:id_utilizador/:id_formador" element={<EditarFormador />} />
          <Route path="/gestor/formadores-pendentes" element={<FormadoresPendentes />} />
          <Route path="/gestor/formandos-pendentes" element={<FormandosPendentes />} />
          <Route path="/gestor/testes/:id_teste" element={<DetalhesTeste />} />

          {/* Formador */}
          <Route path="/formador" element={<FormadorPage />} />
          <Route path="/formador/perfil/:id_utilizador/:id_formador" element={<PerfilFormador />} />
          <Route path="/formador/cursos/:id_curso" element={<DetalhesCurso />} />
          <Route path="/formador/cursos/:id_curso/curso" element={<Curso />} />
          <Route path="/formador/cursos/sincrono/:id_curso" element={<Navigate to="/formador/cursos/:id_curso/curso" replace />} />
          <Route path="/formador/cursos/:id_curso/aulas/nova" element={<NovaAula />} />
          <Route path="/formador/aulas/editar/:id_aula" element={<EditarAula />} />
          <Route path="/formador/cursos/:id_curso/aulas/:id_aula" element={<DetalhesAula />} />
          <Route path="/formador/testes/:id_teste" element={<DetalhesTeste />} />

          {/* Formando */}
          <Route path="/formando" element={<FormandoPage />} />
          <Route path="/formando/perfil/:id_utilizador/:id_formando" element={<PerfilFormando />} />
          <Route path="/formando/cursos/:id_curso" element={<DetalhesCursoFormando />} />
          <Route path="/formando/cursos/:id_curso/curso" element={<Curso />} />
          <Route path="/formando/aulas/:id_aula" element={<DetalhesAula />} />

          {/* Outros */}
          <Route path="/resultados" element={<PaginaResultados />} />
          <Route path="/upPassword" element={<TrocarPassword />} />
          <Route path="/mensagens" element={<MensagensPage />} />
          <Route path="/mensagens/:threadId" element={<ChatPage />} />

          {/* Fórum */}
          <Route path="/forum" element={<ForumHome />} /> 
          {/*<Route path="/formando/forum" element={<ForumFormando />} /> */}
          {/*<Route path="/formador/forum" element={<ForumFormador />} /> */}
          <Route path="/gestor/forum/adicionar-post/:topicoId" element={<AdicionarPostTopico />} />
          <Route path="/gestor/forum" element={<Navigate to="/forum" replace />} /> 
          <Route path="/gestor/forum/:areaId/topicos" element={<ForumAreaTopicos />} />
          <Route path="/formando/forum/:areaId/topicos" element={<ForumAreaTopicos />} />
          <Route path="/formador/forum/:areaId/topicos" element={<ForumAreaTopicos />} />
          <Route path="/gestor/forum/posts/:topicoId" element={<ForumPosts />} />
          <Route path="/gestao-denuncias" element={<GestaoDenuncias />} />
          <Route path="/gestao-denuncias" element={<GestaoDenuncias />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}