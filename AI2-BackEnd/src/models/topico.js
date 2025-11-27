const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Area = require('./area'); 

const Topico = sequelize.define('topico', {
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'area', key: 'id_area' }
  },
  nome_topico: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  topico_ativo: {                           
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'topico',
  schema: 'public',
  timestamps: false,
  indexes: [
    { name: "pk_topico", unique: true, fields: ["id_topico"] }
  ]
});

Topico.belongsTo(Area, { foreignKey: 'id_area', as: 'area' });
Area.hasMany(Topico, { foreignKey: 'id_area', as: 'topicos' });

module.exports = Topico;
