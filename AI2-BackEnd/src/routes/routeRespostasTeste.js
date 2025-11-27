const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadMiddleware'); 
const respostaController = require('../controllers/controllerRespostasTeste');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, upload.single('ficheiro_resposta'), respostaController.submeterResposta);
router.delete('/:id_utilizador/:id_teste', validation, respostaController.removerResposta);
router.get('/:id_teste', validation, respostaController.getRespostasAtivasPorTeste);

module.exports = router;
