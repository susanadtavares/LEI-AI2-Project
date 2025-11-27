const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Utilizadores = require('./utilizadores');
const Notificacao = require('./notificacao');

const Notificar = sequelize.define('notificar', {
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    }
  },
  id_notificacao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'notificacao',
      key: 'id_notificacao'
    }
  },
  notificacao_ativa: {      
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
}, {
  tableName: 'notificar',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_notificar",
      unique: true,
      fields: ['id_utilizador', 'id_notificacao']
    }
  ]
});

Utilizadores.belongsToMany(Notificacao, { through: Notificar, foreignKey: 'id_utilizador', as: 'notificacoes' });
Notificacao.belongsToMany(Utilizadores, { through: Notificar, foreignKey: 'id_notificacao', as: 'destinatarios' });

module.exports = Notificar;
