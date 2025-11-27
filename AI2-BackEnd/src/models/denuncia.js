const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Denuncia = sequelize.define('denuncia', {
  id_denuncia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_publicacao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'publicacao', key: 'id_publicacao' } 
  },
  idcomentario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'comentario', key: 'idcomentario' }
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  data_denuncia: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pendente'
  }
}, {
  tableName: 'denuncia',
  schema: 'public',
  timestamps: false,
  indexes: [
    { name: 'pk_denuncia', unique: true, fields: ['id_denuncia'] },
    { name: 'ix_denuncia_utilizador', fields: ['id_utilizador'] },
    { name: 'ix_denuncia_publicacao', fields: ['id_publicacao'] },
    { name: 'ix_denuncia_comentario', fields: ['idcomentario'] }, 
    { name: 'ix_denuncia_estado', fields: ['estado'] },
  ],
  validate: {
    alvoUnico() {
      const temPub = this.id_publicacao != null;
      const temCom = this.idcomentario != null; 
      if ((temPub && temCom) || (!temPub && !temCom)) {
        throw new Error('A denúncia deve referir apenas uma publicação OU um comentário.');
      }
    }
  }
});

Denuncia.associate = (models) => {
  Denuncia.belongsTo(models.utilizadores, {
    foreignKey: 'id_utilizador',
    as: 'denunciante'
  });

  Denuncia.belongsTo(models.publicacao, {
    foreignKey: 'id_publicacao',
    as: 'publicacao'
  });

  Denuncia.belongsTo(models.comentario, {
    foreignKey: 'idcomentario', 
    as: 'comentario'
  });
};

module.exports = Denuncia;