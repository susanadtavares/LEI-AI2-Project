const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Utilizadores = require('./utilizadores');

const Formador = sequelize.define('formador', {
  id_formador: {
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
  total_formandos: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_cursos: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descricao_formador: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  educacao_formador: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  habilidades_formador: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  certificacoes_formador: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  foto_perfil: {
    type: DataTypes.STRING(300),
    allowNull: true,
    defaultValue: 'https://res.cloudinary.com/di4up9s9u/image/upload/v1755691191/e_bkyeot.png'
  },
  data_inscricao: {
    type: DataTypes.DATE,
    allowNull: false
  },
  formador_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'formador',
  schema: 'public',
  timestamps: false
});

Formador.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'utilizador' });
Utilizadores.hasOne(Formador, { foreignKey: 'id_utilizador', as: 'formador' });

module.exports = Formador;
