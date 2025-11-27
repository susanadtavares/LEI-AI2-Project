const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerRespostasQuiz');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.createRespostaQuiz);
router.get('/', validation, controller.getRespostasQuiz);
router.get('/:id', validation, controller.getRespostaQuizById);
router.put('/:id', validation, controller.updateRespostaQuiz);
router.delete('/:id', validation, controller.deleteRespostaQuiz);

module.exports = router;
