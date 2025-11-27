const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Utilizadores = require('./utilizadores');
const TopicoForum = require('./topico_forum');

const Publicacao = sequelize.define('publicacao', {
  id_publicacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_topico_forum: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'topico_forum', key: 'id_topico_forum' }
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'utilizadores', key: 'id_utilizador' }
  },
  titulo_publicacao: {
    type: DataTypes.STRING(256),
    allowNull: false
  },

  descricao_publicacao: {
    type: DataTypes.STRING(512),
    allowNull: false
  },

  data_publicacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  publicacao_ativa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }

}, {
  tableName: 'publicacao',
  schema: 'public',
  timestamps: false
});

Publicacao.belongsTo(TopicoForum, { foreignKey: 'id_topico_forum', as: 'topico_forum' });
TopicoForum.hasMany(Publicacao, { foreignKey: 'id_topico_forum', as: 'publicacoes' });

Publicacao.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'autor' });
Utilizadores.hasMany(Publicacao, { foreignKey: 'id_utilizador', as: 'publicacoes' });

module.exports = Publicacao;
