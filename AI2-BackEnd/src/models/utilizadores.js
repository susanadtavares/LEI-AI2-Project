const { DataTypes } = require('sequelize');
const sequelize = require('../database/db'); 

const Utilizadores = sequelize.define('utilizadores', {
  id_utilizador: {
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
    allowNull: false
  },
  palavra_passe: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  primeiro_login: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  telemovel: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  data_nascimento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  genero: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  utilizador_ativo: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: true
}

}, {
  tableName: 'utilizadores',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_utilizadores",
      unique: true,
      fields: [
        { name: "id_utilizador" },
      ]
    },
  ]
});

module.exports = Utilizadores;
