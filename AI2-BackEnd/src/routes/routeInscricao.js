const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerInscricao');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.createInscricao);
router.delete('/:id_inscricao', validation, controller.deleteInscricao);

module.exports = router;
