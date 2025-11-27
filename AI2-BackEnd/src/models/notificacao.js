const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Curso = require('./curso'); 

const Notificacao = sequelize.define('notificacao', {
  id_notificacao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true 
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'curso',
      key: 'id_curso'
    }
  },
  titulo_notificacao: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  data_notificacao: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estado: {
  type: DataTypes.ENUM('ativa', 'lida', 'arquivada'),
  allowNull: false,
  defaultValue: 'ativa'
}

}, {
  tableName: 'notificacao',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_notificacao",
      unique: true,
      fields: [{ name: "id_notificacao" }]
    }
  ]
});

Notificacao.belongsTo(Curso, { foreignKey: 'id_curso', as: 'curso' });
Curso.hasMany(Notificacao, { foreignKey: 'id_curso', as: 'notificacoes' });

module.exports = Notificacao;
