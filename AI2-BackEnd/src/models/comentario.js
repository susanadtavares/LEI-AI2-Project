const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Publicacao = require('./publicacao');
const Utilizadores = require('./utilizadores');

const Comentario = sequelize.define('comentario', {
  idcomentario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  id_publicacao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'publicacao', key: 'id_publicacao' }
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'utilizadores', key: 'id_utilizador' }
  },
  data_comentario: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  descricao_comentario: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'comentario', key: 'idcomentario' }
  },
  oculto: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
},  {
  tableName: 'comentario',
  schema: 'public',
  timestamps: false,
  defaultScope: { where: { oculto: false } },
  scopes: { withHidden: {} },
  indexes: [
    { name: 'ix_comentario_publicacao', fields: ['id_publicacao'] },
    { name: 'ix_comentario_parent',     fields: ['parent_id'] },
    { name: 'ix_comentario_data',       fields: ['data_comentario'] },
    { name: 'ix_comentario_pub_parent', fields: ['id_publicacao','parent_id'] },
  ]
},
);

Comentario.belongsTo(Publicacao, { foreignKey: 'id_publicacao', as: 'publicacao' });
Publicacao.hasMany(Comentario, { foreignKey: 'id_publicacao', as: 'comentarios' });

Comentario.belongsTo(Utilizadores, { foreignKey: 'id_utilizador', as: 'autor' });
Utilizadores.hasMany(Comentario, { foreignKey: 'id_utilizador', as: 'comentarios' });

Comentario.belongsTo(Comentario, { as: 'parent',  foreignKey: 'parent_id' });
Comentario.hasMany(Comentario,  { as: 'replies', foreignKey: 'parent_id', onDelete: 'CASCADE' });

module.exports = Comentario;
