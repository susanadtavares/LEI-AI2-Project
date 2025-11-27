const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerTopico');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.createTopico);
router.get('/', validation, controller.getTopicos);
router.get('/:id', validation, controller.getTopicoById);
router.put('/:id', validation, controller.updateTopico);
router.delete('/:id', validation, controller.deleteTopico);

module.exports = router;
