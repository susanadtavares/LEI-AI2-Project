const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Teste = sequelize.define('teste', {
  id_teste: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'curso', key: 'id_curso' }
  },
  anexo_teste: { type: DataTypes.STRING(256), allowNull: false },
  titulo_teste: { type: DataTypes.STRING(256), allowNull: false },
  descricao_teste: { type: DataTypes.STRING(256), allowNull: false },
  dataentrega_teste: { type: DataTypes.DATE, allowNull: false },
  
  teste_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
}

}, {
  tableName: 'teste',
  schema: 'public',
  timestamps: false,
  indexes: [
    { name: "pk_teste", unique: true, fields: ["id_teste"] }
  ]
});

Teste.associate = (models) => {
  Teste.belongsTo(models.curso, { foreignKey: 'id_curso', as: 'curso' });
  Teste.hasMany(models.respostas_teste, { foreignKey: 'id_teste', as: 'respostas' });
};

module.exports = Teste;
