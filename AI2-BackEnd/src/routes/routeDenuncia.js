const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerDenuncia');
const { validation } = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.criarDenuncia);
router.get('/', validation, controller.listarDenuncias);
router.put('/resolvida/:id_denuncia', validation, controller.resolverDenuncia);
router.get('/minhas', validation, controller.minhasDenuncias);

module.exports = router;