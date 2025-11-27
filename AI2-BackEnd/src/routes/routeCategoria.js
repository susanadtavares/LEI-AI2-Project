const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/controllerCategoria');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, categoriaController.createCategoria);
router.get('/', validation, categoriaController.getCategorias);
router.get('/:id', validation, categoriaController.getCategoriaById);
router.put('/:id', validation, categoriaController.updateCategoria);
router.delete('/:id', validation, categoriaController.deleteCategoria);
router.get('/:id/areas-topicos', validation, categoriaController.getAreasETopicosByCategoria);

module.exports = router;
