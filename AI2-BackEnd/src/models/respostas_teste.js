const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const RespostasTeste = sequelize.define('respostas_teste', {
  id_respostateste: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  id_teste: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'teste', key: 'id_teste' }
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'utilizadores', key: 'id_utilizador' }
  },
  id_formando: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'formando', key: 'id_formando' }
  },
  notateste: { type: DataTypes.DECIMAL, allowNull: true },
  data: { type: DataTypes.DATE, allowNull: true },
  hora: { type: DataTypes.TIME, allowNull: true },
  caminho_ficheiro: { type: DataTypes.STRING(300), allowNull: true },
  resposta_ativa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'respostas_teste',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: 'pk_respostas_teste',
      unique: true,
      fields: [{ name: 'id_respostateste' }]
    }
  ]
});

RespostasTeste.associate = (models) => {
  RespostasTeste.belongsTo(models.teste, { foreignKey: 'id_teste', as: 'teste' });
  RespostasTeste.belongsTo(models.utilizadores, { foreignKey: 'id_utilizador', as: 'utilizador' });
  RespostasTeste.belongsTo(models.formando, { foreignKey: 'id_formando', as: 'formando' });
};

module.exports = RespostasTeste;
