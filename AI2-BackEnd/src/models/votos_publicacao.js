const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Publicacao = require('./publicacao');
const Utilizadores = require('./utilizadores');

const VotoPublicacao = sequelize.define('votos_publicacao', {
  id_voto: {
    type: DataTypes.INTEGER,
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
  id_publicacao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'publicacao',
      key: 'id_publicacao'
    }
  },
  valor: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    validate: { isIn: [[-1, 1]] }
  }
}, {
  tableName: 'votos_publicacao',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: 'uniq_voto_por_user_pub',
      unique: true,
      fields: ['id_publicacao', 'id_utilizador']
    }
  ]
});

VotoPublicacao.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'autor_voto' });
VotoPublicacao.belongsTo(Publicacao, { foreignKey: 'id_publicacao', as: 'publicacao' });
Publicacao.hasMany(VotoPublicacao, { foreignKey: 'id_publicacao', as: 'votos' });

module.exports = VotoPublicacao;
