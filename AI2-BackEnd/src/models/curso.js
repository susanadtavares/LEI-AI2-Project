const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Area = require('./area');
const Categoria = require('./categoria');
const Formador = require('./formador');
const Gestor = require('./gestor');
const Topico = require('./topico');

const Curso = sequelize.define('curso', {
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'area', key: 'id_area' }
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'topico', key: 'id_topico' }
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'categoria', key: 'id_categoria' }
  },
  duracao: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  membros: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  num_vagas: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  descricao: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  avaliacao: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true
  },
  tumbnail: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_limite_inscricao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_fim: {
    type: DataTypes.DATE,
    allowNull: true
  },
  introducao_curso: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('Sincrono', 'Assincrono'),
    allowNull: false,
    defaultValue: 'Sincrono'
  },
  id_formador: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'formador', key: 'id_formador' }
  },
  criado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'gestor', key: 'id_gestor' }
  },
  curso_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  curso_visivel: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'curso',
  schema: 'public',
  timestamps: false
});

Curso.belongsTo(Area, { foreignKey: 'id_area', as: 'area' });
Curso.belongsTo(Topico, { foreignKey: 'id_topico', as: 'topico' });
Curso.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });

Curso.belongsTo(Formador, { foreignKey: 'id_formador', as: 'formador' });
Formador.hasMany(Curso, { foreignKey: 'id_formador', as: 'cursos' });

Curso.belongsTo(Gestor, { foreignKey: 'criado_por', as: 'gestor' });
Gestor.hasMany(Curso, { foreignKey: 'criado_por', as: 'cursos_criados' });

Area.hasMany(Curso, { foreignKey: 'id_area', as: 'cursos' });
Topico.hasMany(Curso, { foreignKey: 'id_topico', as: 'cursos' });
Categoria.hasMany(Curso, { foreignKey: 'id_categoria', as: 'cursos' });

module.exports = Curso;
