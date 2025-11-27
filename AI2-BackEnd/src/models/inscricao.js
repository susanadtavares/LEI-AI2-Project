const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Curso = require('./curso');
const Utilizadores = require('./utilizadores');
const Formando = require('./formando');

const Inscricao = sequelize.define('inscricao', {
  id_inscricao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'curso',
      key: 'id_curso'
    }
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    }
  },
  id_formando: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'formando',
      key: 'id_formando'
    }
  },
  estado: {
    type: DataTypes.ENUM('ativo', 'inativo'),
    allowNull: false,
    defaultValue: 'ativo'
  },
  data_inscricao: {
    type: DataTypes.DATE,
    allowNull: true
  },
    adicionado_gestor: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'inscricao',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_inscricao",
      unique: true,
      fields: [{ name: "id_inscricao" }]
    }
  ]
});

Inscricao.belongsTo(Curso, { foreignKey: 'id_curso', as: 'curso' });
Curso.hasMany(Inscricao, { foreignKey: 'id_curso', as: 'inscricoes' });

Inscricao.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'utilizador' });
Utilizadores.hasMany(Inscricao, { foreignKey: 'id_utilizador', as: 'inscricoes' });

Inscricao.belongsTo(Formando, { foreignKey: 'id_formando', as: 'formando' });
Formando.hasMany(Inscricao, { foreignKey: 'id_formando', as: 'inscricoes' });

module.exports = Inscricao;
