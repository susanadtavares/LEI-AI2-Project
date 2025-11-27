const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerComentario');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.createComentario);
router.get('/publicacao/:id_publicacao', validation, controller.getComentariosByPublicacao);
router.get('/:id', validation, controller.getComentarioById);
router.delete('/:id', validation, controller.deleteComentario);

module.exports = router;
