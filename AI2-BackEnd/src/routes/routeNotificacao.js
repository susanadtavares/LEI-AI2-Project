const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerNotificacao');
const {validation} = require('../middleware/jwtMiddleware');

router.get('/minhas/:id_utilizador', validation, controller.getMinhasNotificacoes);
router.put('/marcar-lida/:id_utilizador/:id_notificacao', validation, controller.marcarComoLida);
router.put('/desativar/:id_utilizador/:id_notificacao', validation, controller.softDeleteNotificacao);

module.exports = router;
