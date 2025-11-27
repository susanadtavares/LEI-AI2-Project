const Sequelize = require('sequelize');
const sequelize = require('../database/db');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importa todos os models
db.utilizadores = require('./utilizadores');
db.formador = require('./formador');
db.formando = require('./formando');
db.gestor = require('./gestor');
db.categoria = require('./categoria');
db.area = require('./area');
db.topico = require('./topico');
db.topico_forum = require('./topico_forum');
db.curso = require('./curso');
db.aula = require('./aula');
db.anexo_aula = require('./anexo_aula');
db.anexo_publicacao = require('./anexo_publicacao');
db.publicacao = require('./publicacao');
db.comentario = require('./comentario');
db.votos_publicacao = require('./votos_publicacao');
db.quiz = require('./quiz');
db.respostas_quiz = require('./respostas_quiz');
db.teste = require('./teste');
db.respostas_teste = require('./respostas_teste');
db.avaliacao_curso = require('./avaliacao_curso');
db.notificacao = require('./notificacao');
db.notificar = require('./notificar');
db.inscricao = require('./inscricao');
db.pedidos_registo = require('./pedidos_registo');
db.denuncia = require('./denuncia');
db.solicitacao_topico_forum = require('./solicitacao_topico_forum');

// Executa associações, caso existam
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
