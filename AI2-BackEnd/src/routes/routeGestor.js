const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerGestor');
const {validation} = require('../middleware/jwtMiddleware');

router.get('/', validation, controller.getGestores);
router.get('/:id_gestor', validation, controller.getGestorById);

module.exports = router;
