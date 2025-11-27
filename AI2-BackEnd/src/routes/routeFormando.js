const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerFormando');
const { validation } = require('../middleware/jwtMiddleware');

router.get('/', validation, controller.getFormandos);

router.get('/:id_utilizador/:id_formando/full', validation, controller.getFormandoFullById);
router.put('/:id_utilizador/:id_formando/full', validation, controller.updateFormandoFull);

router.get('/:id_utilizador/:id_formando', validation, controller.getFormandoById);
router.delete('/:id_utilizador/:id_formando', validation, controller.deleteFormando);

module.exports = router;