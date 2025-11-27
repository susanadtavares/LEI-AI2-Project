const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Curso = require('./curso'); 

const Aula = sequelize.define('aula', {
  id_aula: {
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
  url_video: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  titulo_aula: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  descricao_aula: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  aula_ativa: {                           
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'aula',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_aula",
      unique: true,
      fields: [{ name: "id_aula" }]
    }
  ]
});

Aula.belongsTo(Curso, {
  foreignKey: 'id_curso',
  as: 'curso'
});

Curso.hasMany(Aula, {
  foreignKey: 'id_curso',
  as: 'aulas'
});

module.exports = Aula;
