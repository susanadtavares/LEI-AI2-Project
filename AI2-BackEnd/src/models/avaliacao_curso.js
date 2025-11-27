const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Curso = require('./curso');
const Utilizadores = require('./utilizadores');
const Formando = require('./formando');

const AvaliacaoCurso = sequelize.define('avaliacao_curso', {
  id_avaliacao: {
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
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'curso',
      key: 'id_curso'
    }
  },
  n_estrelas: {
    type: DataTypes.DECIMAL(2,1), 
    allowNull: false
  },
  comentario: {
    type: DataTypes.STRING(256),
    allowNull: true
  },
  data: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: true
  },

   avaliacao_curso_ativa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }

}, {
  tableName: 'avaliacao_curso',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_avaliacao_curso",
      unique: true,
      fields: [{ name: "id_avaliacao" }]
    }
  ]
});

AvaliacaoCurso.belongsTo(Curso, { foreignKey: 'id_curso', as: 'curso' });
Curso.hasMany(AvaliacaoCurso, { foreignKey: 'id_curso', as: 'avaliacoes' });

AvaliacaoCurso.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'utilizador' });
Utilizadores.hasMany(AvaliacaoCurso, { foreignKey: 'id_utilizador', as: 'avaliacoes' });

AvaliacaoCurso.belongsTo(Formando, { foreignKey: 'id_formando', as: 'formando' });
Formando.hasMany(AvaliacaoCurso, { foreignKey: 'id_formando', as: 'avaliacoes' });

module.exports = AvaliacaoCurso;
