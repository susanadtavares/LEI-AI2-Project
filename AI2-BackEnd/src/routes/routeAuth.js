const express = require('express');
const router = express.Router();
const authController = require('../controllers/controllerAuth');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/login', authController.login);
router.post('/verificar-email', authController.verificarEmail);
router.put('/:id_utilizador/alterar-password-primeiro-login', validation, authController.alterarPasswordPrimeiroLogin);

module.exports = router;
