const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerArea');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.createArea);
router.get('/', validation, controller.getAreas);
router.get('/:id', validation, controller.getAreaById);
router.put('/:id', validation, controller.updateArea);
router.delete('/:id', validation, controller.deleteArea);
router.get('/:id/topicos', validation, controller.getTopicosByArea);

module.exports = router;
