const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerPublicacao');
const { upload } = require('../middleware/uploadMiddleware');
const { validation } = require('../middleware/jwtMiddleware');

router.post(
  '/',
  validation,
  upload.fields([
    { name: 'imagens', maxCount: 5 },
    { name: 'videos', maxCount: 2 },
    { name: 'ficheiros', maxCount: 5 }
  ]),
  controller.createPublicacao
);

router.get(
  '/topico/:id_topico_forum',
  validation,
  controller.getPublicacoes
);

router.get(
  '/:id',
  validation,
  controller.getPublicacaoById
);

router.delete(
  '/:id',
  validation,
  controller.deletePublicacao
);

router.get(
  '/posts/:id_topico_forum',
  validation,
  controller.getPostsByTopicoId
);

module.exports = router;