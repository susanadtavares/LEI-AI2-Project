const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Categoria = require('./categoria');

const Area = sequelize.define('area', {
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categoria',
      key: 'id_categoria'
    }
  },
  nome_area: {
    type: DataTypes.STRING(256),
    allowNull: true
  },
  area_ativa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'area',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_area",
      unique: true,
      fields: [
        { name: "id_area" },
      ]
    },
  ]
});

Area.belongsTo(Categoria, {
  foreignKey: 'id_categoria',
  as: 'categoria'
});

Categoria.hasMany(Area, {
  foreignKey: 'id_categoria',
  as: 'areas'
});

module.exports = Area;
