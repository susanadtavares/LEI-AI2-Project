const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerFormador');
const { validation } = require('../middleware/jwtMiddleware');

router.get('/', validation, controller.getFormadores);

router.get('/:id_utilizador/:id_formador/full', validation, controller.getFormadorFullById);
router.put('/:id_utilizador/:id_formador/full', validation, controller.updateFormadorFull);

router.get('/:id_utilizador/:id_formador', validation, controller.getFormadorById);
router.delete('/:id_utilizador/:id_formador', validation, controller.deleteFormador);

module.exports = router;
