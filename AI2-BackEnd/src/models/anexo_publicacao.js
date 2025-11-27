const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Publicacao = require('./publicacao');

const AnexoPublicacao = sequelize.define('anexo_publicacao', {
  idanexo_publicacao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  id_publicacao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'publicacao',
      key: 'id_publicacao'
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
  anexo_publicacao_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'anexo_publicacao',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "pk_anexo_publicacao",
      unique: true,
      fields: [{ name: "idanexo_publicacao" }]
    }
  ]
});

AnexoPublicacao.belongsTo(Publicacao, { foreignKey: 'id_publicacao', as: 'publicacao' });
Publicacao.hasMany(AnexoPublicacao, { foreignKey: 'id_publicacao', as: 'anexos' });

module.exports = AnexoPublicacao;
