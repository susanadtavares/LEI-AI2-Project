const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Categoria = sequelize.define('categoria', {
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: true,
    primaryKey: true,
    autoIncrement: true
  },
  nome_categoria: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  categoria_ativa: {                           
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'categoria',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_categoria",
      unique: true,
      fields: [
        { name: "id_categoria" },
      ]
    },
  ]
});

module.exports = Categoria;
