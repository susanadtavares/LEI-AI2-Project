const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Area = require('./area');

const TopicoForum = sequelize.define('topico_forum', {
  id_topico_forum: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
   id_area: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: { model: 'area', key: 'id_area' } 
  },
  titulo_topico: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  descricao_topico: {
    type: DataTypes.STRING(512),
    allowNull: true
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }

}, {
  tableName: 'topico_forum',
  schema: 'public',
  timestamps: false
});

TopicoForum.belongsTo(Area, { foreignKey: 'id_area', as: 'area' });
Area.hasMany(TopicoForum, { foreignKey: 'id_area', as: 'topicos_forum' });

module.exports = TopicoForum;
