const express = require('express');
const router = express.Router();
const utilizadorController = require('../controllers/controllerUtilizadores');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, utilizadorController.createUtilizador);
router.get('/', validation, utilizadorController.getUtilizadores);
router.get('/:id', validation, utilizadorController.getUtilizadorById);
router.put('/:id', validation, utilizadorController.updateUtilizador);
router.delete('/:id', validation, utilizadorController.deleteUtilizador);
router.put('/:id_utilizador/update-password', validation, utilizadorController.updatePassword);

module.exports = router;
