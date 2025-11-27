const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Utilizadores = require('./utilizadores');

const Formando = sequelize.define('formando', {
  id_formando: {
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
  n_cursosacabados: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  n_cursosinscritos: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descricao_formando: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  educacao_formando: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  habilidades_formando: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  certificacoes_formando: {
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
  formando_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'formando',
  schema: 'public',
  timestamps: false
});

Formando.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'utilizador' });
Utilizadores.hasOne(Formando, { foreignKey: 'id_utilizador', as: 'formando' });

module.exports = Formando;
