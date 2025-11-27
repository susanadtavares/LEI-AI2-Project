const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerNotificar');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.createNotificacaoEnviada);
router.get('/', validation, controller.getNotificacoesEnviadas);
router.delete('/:id_utilizador/:id_notificacao', validation, controller.deleteNotificacaoEnviada);

module.exports = router;
