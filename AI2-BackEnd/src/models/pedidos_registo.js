const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const PedidosRegisto = sequelize.define('pedidos_registo', {
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: { isEmail: true }
  },
  tipo: {
    type: DataTypes.ENUM('formando', 'formador'),
    allowNull: false
  },
  telemovel: {
    type: DataTypes.STRING(15),   
    allowNull: false
  },
  data_nascimento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  genero: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  data_pedido: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.ENUM('pendente', 'aprovado', 'rejeitado'),
    allowNull: false,
    defaultValue: 'pendente'
  },
  data_aprovacao: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'pedidos_registo',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: 'pk_pedidos_registo',
      unique: true,
      fields: [{ name: 'id_pedido' }]
    }
  ]
});

module.exports = PedidosRegisto;
