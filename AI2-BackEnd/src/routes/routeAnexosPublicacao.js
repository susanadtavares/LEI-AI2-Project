const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerAnexoPublicacao');
const { upload } = require('../middleware/uploadMiddleware'); 
const {validation} = require('../middleware/jwtMiddleware');

router.get('/:id_publicacao', validation, controller.getAnexosByPublicacao);
router.delete('/:id_anexo_publicacao', validation, controller.deleteAnexo);
router.post('/upload/:id_publicacao', validation, upload.array('anexos'), controller.uploadAnexos);

module.exports = router;
