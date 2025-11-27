const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerQuiz');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.createQuiz);
router.get('/', validation, controller.getQuizzes);
router.get('/:id', validation, controller.getQuizById);
router.put('/:id', validation, controller.updateQuiz);
router.delete('/:id', validation, controller.deleteQuiz);

module.exports = router;
