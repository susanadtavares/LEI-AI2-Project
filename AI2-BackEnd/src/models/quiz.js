const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Curso = require('./curso');

const Quiz = sequelize.define('quiz', {
  id_quiz: {
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
  descricao_quiz: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  titulo_quiz: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  n_perguntas: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quiz: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  quiz_ativo: {   
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'quiz',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_quiz",
      unique: true,
      fields: [{ name: "id_quiz" }]
    }
  ]
});

Quiz.belongsTo(Curso, {
  foreignKey: 'id_curso',
  as: 'curso'
});

Curso.hasMany(Quiz, {
  foreignKey: 'id_curso',
  as: 'quizzes'
});

module.exports = Quiz;
