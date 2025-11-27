const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Utilizadores = require('./utilizadores');

const Gestor = sequelize.define('gestor', {
  id_gestor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    }
  },
  gestor_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'gestor',
  schema: 'public',
  timestamps: false
});

Gestor.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'utilizador' });
Utilizadores.hasOne(Gestor, { foreignKey: 'id_utilizador', as: 'gestor' });

module.exports = Gestor;
