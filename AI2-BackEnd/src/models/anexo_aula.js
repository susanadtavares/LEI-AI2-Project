const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Aula = require('./aula');

const AnexoAula = sequelize.define('anexo_aula', {
  id_anexoaula: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_aula: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'aula',
      key: 'id_aula'
    }
  },
  nome_original: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tamanho: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  anexo_aula_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'anexo_aula',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_anexo_aula",
      unique: true,
      fields: ["id_anexoaula"]
    }
  ]
});

AnexoAula.belongsTo(Aula, { foreignKey: 'id_aula', as: 'aula' });
Aula.hasMany(AnexoAula, { foreignKey: 'id_aula', as: 'anexos' });

module.exports = AnexoAula;
