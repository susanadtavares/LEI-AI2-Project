const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Quiz = require('./quiz');
const Utilizadores = require('./utilizadores');
const Formando = require('./formando');

const RespostasQuiz = sequelize.define('respostas_quiz', {
  id_respostaquiz: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
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
  id_quiz: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quiz',
      key: 'id_quiz'
    }
  },
  respostas: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  notaquiz: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  data: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: true
  }
}, {
  tableName: 'respostas_quiz',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_respostas_quiz",
      unique: true,
      fields: [{ name: "id_respostaquiz" }]
    }
  ]
});

RespostasQuiz.belongsTo(Quiz, { foreignKey: 'id_quiz', as: 'quiz' });
Quiz.hasMany(RespostasQuiz, { foreignKey: 'id_quiz', as: 'respostas' });

RespostasQuiz.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'utilizador' });
Utilizadores.hasMany(RespostasQuiz, { foreignKey: 'id_utilizador', as: 'respostas_quiz' });

RespostasQuiz.belongsTo(Formando, { foreignKey: 'id_formando', as: 'formando' });
Formando.hasMany(RespostasQuiz, { foreignKey: 'id_formando', as: 'respostas_quiz' });

module.exports = RespostasQuiz;
