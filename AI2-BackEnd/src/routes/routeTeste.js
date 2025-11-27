const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerTeste');
const { upload } = require('../middleware/uploadMiddleware'); 
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, upload.single('anexo_teste'), controller.criarTeste);
router.get('/', validation, controller.getTestes);
router.get('/:id', validation, controller.getTesteById);
router.put('/:id', validation, upload.single('anexo_teste'), controller.updateTeste);
router.delete('/:id', validation, controller.deleteTeste);

module.exports = router;
