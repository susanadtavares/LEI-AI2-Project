const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerCurso');
const { upload } = require('../middleware/uploadMiddleware');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'imagem', maxCount: 1 }]), (req, res, next) => {
  // normaliza para controller usar sempre req.file
  req.file = (req.files?.thumbnail?.[0]) || (req.files?.imagem?.[0]) || undefined;
  next();
}, controller.createCurso);
router.get('/:id_curso/membros', validation, controller.getMembrosDoCurso);

router.get('/categoria/:id_categoria', validation, controller.getCursosByCategoria);
router.get('/area/:id_area', validation, controller.getCursosByArea);
router.get('/topico/:id_topico', validation, controller.getCursosByTopico);

router.get('/', validation, controller.getCursos);
router.get('/:id', validation, controller.getCursoById);
router.put('/:id', validation, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'imagem', maxCount: 1 }]), (req, res, next) => {
  req.file = (req.files?.thumbnail?.[0]) || (req.files?.imagem?.[0]) || undefined;
  next();
}, controller.updateCurso);

router.delete('/:id', validation, controller.deleteCurso);

router.put('/:id/ocultar', validation, controller.ocultarCurso);
router.put('/:id/desocultar', validation, controller.desocultarCurso);

router.post('/:id/adicionar-membro', validation, controller.adicionarMembroAoCurso);
router.post('/:id/remover-membro', validation, controller.removerMembroDoCurso);

module.exports = router;
