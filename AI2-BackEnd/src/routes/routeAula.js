const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerAula');
const { upload } = require('../middleware/uploadMiddleware'); 
const {validation} = require('../middleware/jwtMiddleware');

router.post(
  '/', 
  validation,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'anexos', maxCount: 5 }
  ]),
  controller.createAula
);

router.get('/', validation, controller.getAulas);
router.get('/:id', validation, controller.getAulaById);

router.put(
  '/:id', 
  validation,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'anexos', maxCount: 5 }
  ]),
  controller.updateAula
);

router.delete('/:id', validation, controller.deleteAula);

module.exports = router;
