require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const sequelize = require('./database/db');
const cron = require('node-cron');
// Configuração do CORS

//call trigger 
const { notifyStudentEnrollmentforEmail } = require('./database/logic_objects/triggers/triggers');
const {notifyStudentOnCourseUnenrollment} = require('./database/logic_objects/triggers/triggers');
const {notifyInstructorBeforeCourseStart} = require('./database/logic_objects/triggers/triggers');
const {notifyStudentOnCourseEnrollment} = require('./database/logic_objects/triggers/triggers');
const {notifyStudentOnCourseRemoval} = require('./database/logic_objects/triggers/triggers');

app.use(cors({
  origin: 'http://localhost:3001', // <-- o frontend
  credentials: true
}));

const Path = require('path');

const categoriaRoutes = require('./routes/routeCategoria');
const utilizadorRoutes = require('./routes/routeUtilizadores');
const areaRoutes = require('./routes/routeArea');
const topicoRoutes = require('./routes/routeTopico'); 
const cursoRoutes = require('./routes/routeCurso'); 
const aulaRoutes = require('./routes/routeAula'); 
const publicacaoRoutes = require('./routes/routePublicacao');
const comentarioRoutes = require('./routes/routeComentario'); 
const quizRoutes = require('./routes/routeQuiz');
const respostasQuizRoutes = require('./routes/routeRespostasQuiz'); 
const formadorRoutes = require('./routes/routeFormador');
const formandoRoutes = require('./routes/routeFormando');
const notificacaoRoutes = require('./routes/routeNotificacao');
const notificarRoutes = require('./routes/routeNotificar');
const gestorRoutes = require('./routes/routeGestor');  
const inscricaoRoutes = require('./routes/routeInscricao'); 
const avaliacaoCursoRoutes = require('./routes/routeAvaliacaoCurso');
const testeRoutes = require('./routes/routeTeste'); 
const authRoutes = require('./routes/routeAuth'); //novo -------------- LOGIN
const dashboardRoutes = require('./routes/routeDashboard'); // novo -------------- DASHBOARD ADMIN
const uploadRoutes = require('./routes/routeUpload'); // novo -------------- UPLOAD DE IMAGENS
const pedidosRegistoRouter = require("./routes/routePedidosRegisto"); // novo -------------- PEDIDOS DE REGISTO
const emailRoutes = require('./routes/routeEmail'); // novo -------------- EMAIL
const respostaRoutes = require('./routes/routeRespostasTeste'); // novo -------------- RESPOSTAS A TESTES
const topicoForumRoutes = require('./routes/routeTopicoForum');
const votosPublicacaoRoutes = require('./routes/routeVotosPublicacao'); // novo -------------- VOTOS PUBLICAÇÕES
const denunciasRoutes = require('./routes/routeDenuncia'); // novo -------------- DENÚNCIAS
const solicitacaoTopicoForumRoutes = require("./routes/routeSolicitacaoTopicoForum");
const searchRoutes = require('./routes/routeSearch');


// Configurações
app.set('port', process.env.port || 3000);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.json());

const initializeDatabase = async () => {
  try {
    // Sync database
    await sequelize.sync({ alter: true });
    console.log('Base de dados sincronizada com sucesso!');
    
    // Create triggers after database sync
    await notifyStudentEnrollmentforEmail();
    await notifyStudentOnCourseUnenrollment();
    await notifyStudentOnCourseEnrollment();
    await notifyStudentOnCourseRemoval();
    console.log('Database triggers created successfully!');
    
  } catch (err) {
    console.error('Erro ao inicializar base de dados:', err);
    process.exit(1); // Exit if database initialization fails
  }
};

initializeDatabase();






//Executar a cada dia às 9:00 para verificar cursos que começam amanhã
cron.schedule('0 9 * * *', () => {
  console.log('Verificando cursos que começam amanhã...');
  notifyInstructorBeforeCourseStart();
});



//UPLOAD DE IMAGENS
app.use('/uploads', express.static(Path.join(__dirname, 'uploads')));

// Corrigir aqui o caminho da rota
app.use('/api/categorias', categoriaRoutes);
app.use('/api/utilizadores', utilizadorRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/topicos', topicoRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/aulas', aulaRoutes);
app.use('/api/publicacao', publicacaoRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/respostas_quiz', respostasQuizRoutes);
app.use('/api/formadores', formadorRoutes);
app.use('/api/formandos', formandoRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/notificar', notificarRoutes);
app.use('/api/gestores', gestorRoutes);
app.use('/api/inscricoes', inscricaoRoutes);
app.use('/api/avaliacao_curso', avaliacaoCursoRoutes);
app.use('/api/testes', testeRoutes);
app.use('/api/auth', authRoutes); //novo -------------- LOGIN
app.use('/api/dashboard', dashboardRoutes); // novo -------------- DASHBOARD ADMIN
app.use('/api/upload', uploadRoutes); // novo -------------- UPLOAD DE IMAGENS
app.use("/api/pedidos-registo", pedidosRegistoRouter);// novo -------------- PEDIDOS DE REGISTO
app.use('/api/email', emailRoutes);
app.use('/api/respostas', respostaRoutes); // novo -------------- RESPOSTAS A TESTES
app.use('/api/topicos-forum', topicoForumRoutes);
app.use('/api/votos-publicacao', votosPublicacaoRoutes);
app.use('/api/denuncias', denunciasRoutes);
app.use("/api/solicitacoes-topico", solicitacaoTopicoForumRoutes);
app.use('/api/search', searchRoutes);

// Sincronizar e arrancar servidor
app.get('/', (req, res) => {
  res.send('API do backend está a funcionar');
});

app.listen(app.get('port'), () => {
    console.log("Server started on port " + app.get('port'));
    //console.log(process.env.ENCRYPTION_KEY);
});


