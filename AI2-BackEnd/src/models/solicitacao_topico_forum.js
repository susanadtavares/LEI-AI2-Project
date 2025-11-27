const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Utilizadores = require('./utilizadores');
const Area = require('./area');

const SolicitacaoTopicoForum = sequelize.define('solicitacao_topico_forum', {
  id_solicitacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_area: { 
      type: DataTypes.INTEGER,
      allowNull: false
    },
  titulo: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING(512),
    allowNull: false
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'utilizadores', key: 'id_utilizador' }
  },
  estado: {
    type: DataTypes.ENUM('pendente', 'aceite', 'rejeitado'),
    allowNull: false,
    defaultValue: 'pendente'
  },
  data_solicitacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'solicitacao_topico_forum',
  schema: 'public',
  timestamps: false
});

SolicitacaoTopicoForum.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'utilizador' });
Utilizadores.hasMany(SolicitacaoTopicoForum, { foreignKey: 'id_utilizador', as: 'solicitacoes_topico' });

SolicitacaoTopicoForum.belongsTo(Area, { foreignKey: 'id_area', as: 'area' });
Area.hasMany(SolicitacaoTopicoForum, { foreignKey: 'id_area', as: 'solicitacoes' });

module.exports = SolicitacaoTopicoForum;
