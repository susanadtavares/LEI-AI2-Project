const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerAvaliacaoCurso');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.createAvaliacao);              
router.delete('/:id', validation, controller.deleteAvaliacao);          
router.get('/curso/:id_curso', validation, controller.getAvaliacoesByCurso); 

module.exports = router;
